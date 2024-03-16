import xmlReader from 'xml2js';
import { getListOfAllReadFiles } from './fileHandler.js';
import { logger } from './logger.js';
import { v4 as uuidv4 } from 'uuid';
import config from '../config.json' assert { type: 'json' };
import fs from 'fs';

const xmlToJsonConverter = async (xml) => {
    return new Promise((resolve, reject) => {
        xmlReader.parseString(xml, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

const extractInvoiceDetails = (json) => {
    let allInvoiceDetails = [];

    json.Restos.Resto.forEach(resto => {
        resto.FiscalDate.forEach(fiscalDate => {
            fiscalDate.Invoice.forEach(invoice => {
                // Assuming each invoice has a single InvoiceDetails object
                // which contains an array of InvoiceDetail
                allInvoiceDetails.push(...invoice.InvoiceDetails[0].InvoiceDetail);
            });
        });
    });

    return allInvoiceDetails;
};

const invoiceDetailsToXML = (invoiceDetails) => {
    return invoiceDetails
        .map((detail, index) => {
            const quantity = parseFloat(detail.Quantity[0]);
            const discountedItemSalePrice = parseFloat(
                detail.DiscountedItemSalePrice[0]._.trim().replace('JD', '')
            );
            const description = detail.Description[0]._;
            const itemSalePrice = parseFloat(
                detail.ItemSalePrice[0]._.trim().replace('JD', '')
            );
            const discountAmount = detail.Discount[0].Amount[0]._
                ? parseFloat(detail.Discount[0].Amount[0]._.trim().replace('JD', ''))
                : 0;
            const taxAmount =
                discountedItemSalePrice * quantity * config.discountPercentage;
            const roundingAmount =
                discountedItemSalePrice * quantity * config.discountPercentage +
                discountedItemSalePrice * quantity;

            return `
                    <cac:InvoiceLine>
                        <cbc:ID>${index + 1}</cbc:ID>
                        <cbc:InvoicedQuantity unitCode="PCE">${quantity}</cbc:InvoicedQuantity>
                        <cbc:LineExtensionAmount currencyID="JO">${(discountedItemSalePrice * quantity)}</cbc:LineExtensionAmount>
                        <cac:TaxTotal>
                            <cbc:TaxAmount currencyID="JO">${taxAmount}</cbc:TaxAmount>
                            <cbc:RoundingAmount currencyID="JO">${roundingAmount}</cbc:RoundingAmount>
                            <cac:TaxSubtotal>
                                <cbc:TaxAmount currencyID="JO">${taxAmount}</cbc:TaxAmount>
                                <cac:TaxCategory>
                                    <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
                                    <cbc:Percent>${config.discount_percentage}</cbc:Percent>
                                    <cac:TaxScheme>
                                        <cbc:ID schemeAgencyID="6" schemeID="UN/ECE5153">VAT</cbc:ID>
                                    </cac:TaxScheme>
                                </cac:TaxCategory>
                            </cac:TaxSubtotal>
                        </cac:TaxTotal>
                        <cac:Item>
                            <cbc:Name>${description}</cbc:Name>
                        </cac:Item>
                        <cac:Price>
                            <cbc:PriceAmount currencyID="JO">${itemSalePrice}</cbc:PriceAmount>
                            <cac:AllowanceCharge>
                                <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                                <cbc:AllowanceChargeReason>DISCOUNT</cbc:AllowanceChargeReason>
                                <cbc:Amount currencyID="JO">${discountAmount}</cbc:Amount>
                            </cac:AllowanceCharge>
                        </cac:Price>
                    </cac:InvoiceLine>`;
        })
        .join('\n');
};

const convertJSONToTaxPayload = (json) => {
    /*
          Assumptions:
          1. The JSON structure is known and fixed.
      */
    const xml_content = [];

    // Invoice Number
    const invoice_number =
        json.Restos.Resto[0].FiscalDate[0].Invoice[0].InvoiceNumber[0];
    xml_content.push(`<cbc:ID>${invoice_number}</cbc:ID>`);

    // First UUID
    const uuid_first = uuidv4();
    xml_content.push(`<cbc:UUID>${uuid_first}</cbc:UUID>`);

    // Issue Date
    const date = json.Restos.Resto[0].FiscalDate[0]['$']['date'].split(' ')[0];
    xml_content.push(`<cbc:IssueDate>${date}</cbc:IssueDate>`);

    // constant appends
    xml_content.push('<cbc:InvoiceTypeCode name="012">388</cbc:InvoiceTypeCode>');
    xml_content.push('<cbc:Note>Sales Invoice</cbc:Note>');
    xml_content.push('<cbc:DocumentCurrencyCode>JOD</cbc:DocumentCurrencyCode>');
    xml_content.push('<cbc:TaxCurrencyCode>JOD</cbc:TaxCurrencyCode>');

    // Additional Document Reference
    const uuid_additional_doc_ref = uuidv4();

    xml_content.push(`
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${uuid_additional_doc_ref}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    `);

    // Allowance charge information

    // Discount
    const totalDiscount = json.Restos.Resto.flatMap((resto) => resto.FiscalDate) // Access each FiscalDate within each Resto
        .flatMap((fiscalDate) => fiscalDate.Invoice) // Access each Invoice within each FiscalDate
        .flatMap((invoice) => invoice.Discounts) // Access Discounts within each Invoice
        .flatMap((discount) => discount.Discount) // Flatten the array of Discounts
        .flatMap((item) => item.Amount) // Get all Amount objects from each Discount
        .map((amount) =>
            parseFloat(amount._.trim().replace('JD', '').replace('-', ''))
        ) // Extract the numeric value and convert it to a float
        .reduce((acc, curr) => acc + curr, 0); // Sum up the amounts

    xml_content.push(`
    <cac:AllowanceCharge>
        <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReason>discount</cbc:AllowanceChargeReason>
        <cbc:Amount currencyID="JO">${totalDiscount}</cbc:Amount>
    </cac:AllowanceCharge>
    `);

    // Tax Total Information
    const total_tax_info = json.Restos.Resto.flatMap((resto) => resto.FiscalDate) // Access each FiscalDate within each Resto
        .flatMap((fiscalDate) => fiscalDate.Invoice) // Access each Invoice within each FiscalDate
        .flatMap((invoice) => invoice.TotalTaxes) // Access TotalTaxes within each Invoice
        .map((totalTaxes) =>
            parseFloat(totalTaxes._.trim().replace('JD', '').replace('-', ''))
        ) // Extract the numeric value and convert it to a float
        .reduce((acc, curr) => acc + curr, 0); // Sum up the amounts (if there are multiple, which your structure suggests might not be the case)
    xml_content.push(`
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="JO">${total_tax_info}</cbc:TaxAmount>
    </cac:TaxTotal>
    `);

    // Legal Monetary Total
    const tax_exclusive_amount = json.Restos.Resto.flatMap(
        (resto) => resto.FiscalDate
    ) // Access each FiscalDate within each Resto
        .flatMap((fiscalDate) => fiscalDate.Invoice) // Access each Invoice within each FiscalDate
        .flatMap((invoice) => invoice.Total) // Access Total within each Invoice
        .map((total) =>
            parseFloat(total._.trim().replace('JD', '').replace('-', ''))
        ) // Extract the numeric value and convert it to a float
        .reduce((acc, curr) => acc + curr, 0); // Sum up the amounts (if there are multiple, which your structure suggests might not be the case)

    // Sub Total Amount
    const sub_total_amount = json.Restos.Resto.flatMap(
        (resto) => resto.FiscalDate
    ) // Access each FiscalDate within each Resto
        .flatMap((fiscalDate) => fiscalDate.Invoice) // Access each Invoice within each FiscalDate
        .flatMap((invoice) => invoice.SubTotals) // Access SubTotals within each Invoice
        .flatMap((subTotals) => subTotals.SubTotal) // Access SubTotal within SubTotals
        .map((subTotal) =>
            parseFloat(subTotal._.trim().replace('JD', '').replace('-', ''))
        ) // Extract the numeric value and convert it to a float
        .reduce((acc, curr) => acc + curr, 0); // Sum up the amounts

    xml_content.push(`
    <cac:LegalMonetaryTotal>
        <cbc:TaxExclusiveAmount currencyID="JO">${tax_exclusive_amount}</cbc:TaxExclusiveAmount>
	    <cbc:TaxInclusiveAmount currencyID="JO">${sub_total_amount}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="JO">${totalDiscount}</cbc:AllowanceTotalAmount>  
	    <cbc:PayableAmount currencyID="JO">${sub_total_amount}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    `);

    // Invoice Line Details
    const allInvoiceDetails = extractInvoiceDetails(json);
    xml_content.push(invoiceDetailsToXML(allInvoiceDetails));
    return xml_content.join('\n');
};

const main = async () => {
    /*
          1. Get All the Files that need to be processed from a directory.
          2. Read the files and parse the XML content.
          3. Perform the transformations as per the XL shared by Nadeem.
          4. return the transformed JSON data.
      */
    const files = getListOfAllReadFiles();
    logger.info(`Files to be processed: ${files.join(', ')}`);

    for (let i = 0; i < files.length; i++) {
        const xmlFile = fs.readFileSync(`files/read/${files[i]}`, 'utf-8');
        const xmlContent = await xmlToJsonConverter(xmlFile);
        const result = convertJSONToTaxPayload(xmlContent);
        fs.writeFileSync(`files/dump/result-${files[i]}.xml`, result);
    }
};

main();
