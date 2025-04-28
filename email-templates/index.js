import fs from 'fs/promises';
import Handlebars from 'handlebars';

// Register partials
async function registerPartials() {
  const headerTemplate = await fs.readFile('./email-templates/partials/header.hbs', 'utf8');
  const footerTemplate = await fs.readFile('./email-templates/partials/footer.hbs', 'utf8');
  
  Handlebars.registerPartial('header', headerTemplate);
  Handlebars.registerPartial('footer', footerTemplate);
}

// Compile the base layout
async function compileBaseLayout() {
  const baseTemplate = await fs.readFile('./email-templates/base.hbs', 'utf8');
  return Handlebars.compile(baseTemplate);
}

// Register helper for layout inheritance
Handlebars.registerHelper('extend', function(name, context) {
  let block = Handlebars.partials[name];
  if (!block) {
    throw new Error(`Partial ${name} not found`);
  }
  
  if (typeof block !== 'function') {
    block = Handlebars.compile(block);
  }
  
  return block(this);
});

// Main function to render email
async function renderEmail(templateName, data) {
  await registerPartials();
  const baseLayout = await compileBaseLayout();
  
  // Read the specific email template
  const emailTemplate = await fs.readFile(`./email-templates/${templateName}.hbs`, 'utf8');
  const compiledEmailTemplate = Handlebars.compile(emailTemplate);
  
  // Render the email content
  const emailContent = compiledEmailTemplate(data);
  
  // Render the full email with layout
  return baseLayout({
    title: data.title || 'ID Certify',
    body: emailContent,
    showReceiptIcon: templateName.includes('receipt') || templateName.includes('verification'),
    ...data
  });
}

// Example usage for generic verification request
async function renderVerificationRequest(verificationType) {
  const emailHtml = await renderEmail('verification-request', {
    candidateName: 'Nneoma Okoro',
    verificationType: verificationType,
    companyName: 'Coco Melon LTD',
    jobRole: 'Project Manager',
    verificationUrl: `https://idcertify.ai/verify/${verificationType.toLowerCase()}/123456`,
    expiryDays: 3,
    days: '02',
    hours: '23',
    minutes: '54',
    seconds: '58',
    companyPhone: '07000474822',
    companyEmail: 'Cocomelon@gmail.com',
    companyAddress: 'No 23 Ajaya Street Ikeja',
    reportUrl: 'https://idcertify.ai/report/123456',
    year: new Date().getFullYear(),
    title: `${verificationType} Verification Request`
  });
  
  const filename = verificationType.toLowerCase().replace(/\s+/g, '-');
  await fs.writeFile(`rendered-${filename}-verification-request.html`, emailHtml);
  console.log(`${verificationType} Verification Request Email saved to rendered-${filename}-verification-request.html`);
  
  return emailHtml;
}

// Main function
async function main() {
  try {
    // Render different verification request types
    await renderVerificationRequest('Job');
    await renderVerificationRequest('Address');
    await renderVerificationRequest('Identity');
    await renderVerificationRequest('Education');
    await renderVerificationRequest('Criminal Record');
    
    console.log('All verification request emails generated successfully!');
  } catch (error) {
    console.error('Error rendering emails:', error);
  }
}

main();