### ID Certify Email Template System Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Setup Instructions](#setup-instructions)
3. [Template Structure](#template-structure)
4. [Using the Templates](#using-the-templates)
5. [Creating New Templates](#creating-new-templates)
6. [Customization Options](#customization-options)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)


## System Overview

The ID Certify Email Template System is a Handlebars-based solution for generating consistent, branded HTML emails. The system uses a base layout template with content-specific templates to create various types of emails including welcome messages, receipts, and verification requests.

**Key Features:**

- Template inheritance using a base layout
- Partial components for reusable elements
- Responsive design for all device sizes
- Consistent branding across all emails
- Easy customization of content and styling


## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn


### Installation

1. Install required dependencies:


```shellscript
npm install handlebars
```

2. Create the directory structure:


```shellscript
mkdir -p email-templates/partials
```

3. Copy the template files into the appropriate directories:

1. `base.hbs` → `email-templates/`
2. `header.hbs` and `footer.hbs` → `email-templates/partials/`
3. All other templates → `email-templates/`



4. Create a JavaScript file (e.g., `email-renderer.js`) to use the templates.


## Template Structure

### Directory Structure

```plaintext
email-templates/
│
├── base.hbs                    # Base layout template
├── partials/
│   ├── header.hbs              # Header partial
│   └── footer.hbs              # Footer partial
├── welcome.hbs                 # Welcome email template
├── receipt.hbs                 # Generic receipt template
├── verification-receipt.hbs    # Verification receipt template
└── verification-request.hbs    # Verification request template
```

### Base Layout

The `base.hbs` file serves as the foundation for all emails. It includes:

- HTML document structure
- CSS styling
- Header and footer sections
- Placeholder for email-specific content


### Template Types

1. **Welcome Email**: Used for onboarding new users
2. **Receipt Templates**: For transaction confirmations
3. **Verification Request Templates**: For requesting various types of verifications


## Using the Templates

### Basic Usage

```javascript
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
```

### Rendering Different Email Types

#### Welcome Email

```javascript
async function sendWelcomeEmail(user) {
  const emailHtml = await renderEmail('welcome', {
    name: user.name,
    backgroundCheckUrl: 'https://idcertify.ai/background-check',
    year: new Date().getFullYear(),
    title: 'Welcome to ID Certify'
  });
  
  // Send the email using your preferred email service
  // ...
  
  return emailHtml;
}
```

#### Receipt Email

```javascript
async function sendReceiptEmail(transaction) {
  const emailHtml = await renderEmail('receipt', {
    name: transaction.userName,
    refNumber: transaction.refNumber,
    paymentTime: transaction.timestamp,
    paymentMethod: transaction.paymentMethod,
    verificationType: transaction.verificationType,
    recipient: transaction.recipient,
    amount: transaction.amount,
    qrCodeUrl: transaction.qrCodeUrl,
    pdfUrl: transaction.pdfUrl,
    year: new Date().getFullYear(),
    title: 'Payment Receipt'
  });
  
  // Send the email using your preferred email service
  // ...
  
  return emailHtml;
}
```

#### Verification Request Email

```javascript
async function sendVerificationRequestEmail(request) {
  const emailHtml = await renderEmail('verification-request', {
    candidateName: request.candidateName,
    verificationType: request.verificationType,
    companyName: request.companyName,
    jobRole: request.jobRole,
    verificationUrl: `https://idcertify.ai/verify/${request.verificationType.toLowerCase()}/${request.id}`,
    expiryDays: request.expiryDays,
    days: request.countdown.days,
    hours: request.countdown.hours,
    minutes: request.countdown.minutes,
    seconds: request.countdown.seconds,
    companyPhone: request.companyPhone,
    companyEmail: request.companyEmail,
    companyAddress: request.companyAddress,
    reportUrl: `https://idcertify.ai/report/${request.id}`,
    year: new Date().getFullYear(),
    title: `${request.verificationType} Verification Request`
  });
  
  // Send the email using your preferred email service
  // ...
  
  return emailHtml;
}
```

## Creating New Templates

### Steps to Create a New Template

1. Create a new `.hbs` file in the `email-templates` directory
2. Design your template content using Handlebars syntax
3. Use the template with the `renderEmail` function


### Template Example

```handlebars
<h2>Hi {{name}},</h2>
<h1>Your {{documentType}} is Ready</h1>

<p>We're pleased to inform you that your {{documentType}} is now ready for download.</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{downloadUrl}}" style="display: inline-block; background-color: #B11116; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">
    Download Now
  </a>
</div>

<p>This link will expire in {{expiryDays}} days. Please download your document before then.</p>
```

## Customization Options

### Styling

The base template includes CSS styling that can be customized:

- Colors: Change the primary color (`#B11116`) and secondary color (`#8B0000`)
- Fonts: Modify the font family in the body style
- Layout: Adjust the container width, padding, and margins


### Dynamic Content

All templates support dynamic content through Handlebars variables:

- Text content: `{{variableName}}`
- HTML content: `{{{variableName}}}`
- Conditional sections: `{{#if condition}}...{{/if}}`
- Loops: `{{#each items}}...{{/each}}`


### Images

You can customize the images used in the templates:

- Logo: Update the logo URL in the base template
- Icons: Change the icons used in specific templates
- Background images: Modify background image URLs


## Best Practices

### Email Design

1. **Keep it simple**: Avoid complex layouts that might break in email clients
2. **Use tables for layout**: Email clients have better support for table-based layouts
3. **Inline CSS**: Use inline styles for better compatibility
4. **Test across clients**: Test emails in various email clients (Gmail, Outlook, etc.)


### Template Management

1. **Consistent naming**: Use descriptive, consistent names for templates
2. **Version control**: Keep templates in version control
3. **Documentation**: Document the purpose and variables for each template
4. **Reuse components**: Create partials for reusable elements


### Performance

1. **Precompile templates**: For production, precompile templates to improve performance
2. **Cache compiled templates**: Cache compiled templates to avoid repeated compilation
3. **Optimize images**: Use optimized images to reduce email size


## Troubleshooting

### Common Issues

#### Template Not Found

```plaintext
Error: ENOENT: no such file or directory, open './email-templates/template-name.hbs'
```

**Solution**: Verify the template file exists and the path is correct.

#### Partial Not Found

```plaintext
Error: Partial header not found
```

**Solution**: Ensure all partials are registered before rendering the template.

#### Variable Not Defined

```plaintext
Error: Cannot read property 'name' of undefined
```

**Solution**: Make sure all required variables are provided in the data object.

### Debugging Tips

1. **Log template data**: Log the data object to ensure all variables are present
2. **Inspect rendered HTML**: Save the rendered HTML to a file for inspection
3. **Use try/catch**: Wrap template rendering in try/catch blocks to handle errors gracefully


```javascript
try {
  const emailHtml = await renderEmail('template-name', data);
  // Use emailHtml
} catch (error) {
  console.error('Error rendering email:', error);
  // Handle error
}
```

## Integration Examples

### Sending Emails with Nodemailer

```javascript
import nodemailer from 'nodemailer';

async function sendEmail(to, subject, html) {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@example.com',
      pass: 'your-password'
    }
  });

  // Send the email
  const info = await transporter.sendMail({
    from: '"ID Certify" <noreply@idcertify.ai>',
    to,
    subject,
    html
  });

  return info;
}

// Example usage
async function sendWelcomeEmailToUser(user) {
  const html = await renderEmail('welcome', {
    name: user.name,
    backgroundCheckUrl: 'https://idcertify.ai/background-check',
    year: new Date().getFullYear()
  });
  
  return sendEmail(user.email, 'Welcome to ID Certify', html);
}
```

### Integration with AWS SES

```javascript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'us-east-1' });

async function sendEmailWithSES(to, subject, html) {
  const params = {
    Source: 'noreply@idcertify.ai',
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Subject: {
        Data: subject
      },
      Body: {
        Html: {
          Data: html
        }
      }
    }
  };

  const command = new SendEmailCommand(params);
  return sesClient.send(command);
}
```

---

This documentation provides a comprehensive guide to using the ID Certify Email Template System. For additional support or questions, please contact the development team.