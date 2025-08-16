import { InvitationEmailData, EmailTemplate } from '../interfaces';

export function createInvitationEmailTemplate(data: InvitationEmailData): EmailTemplate {
  const roleDisplayNames = {
    SUPERADMIN: 'Super Administrator',
    DEPARTMENT_ADMIN: 'Department Administrator',
    STAFF: 'Staff Member',
  };

  const subject = `Welcome to Nayara Bocas del Toro - HR Portal Invitation`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nayara HR Portal Invitation</title>
        <style>
            body {
                font-family: 'Proxima Nova', Tahoma, Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #F5EBD7;
                color: #4A4A4A;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #AA8E67, #7C8E67);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                font-family: 'Gotham Black', Tahoma, sans-serif;
                font-size: 24px;
                font-weight: 900;
                text-transform: uppercase;
                margin: 0;
                letter-spacing: 1px;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #4A4A4A;
            }
            .message {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
                color: #666;
            }
            .invitation-details {
                background-color: #DCFEF4;
                border-left: 4px solid #7C8E67;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            .detail-label {
                font-weight: 600;
                color: #4A4A4A;
            }
            .detail-value {
                color: #666;
            }
            .cta-container {
                text-align: center;
                margin: 40px 0;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #AA8E67, #7C8E67);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(170, 142, 103, 0.3);
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(170, 142, 103, 0.4);
            }
            .expiry-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 30px 0;
                font-size: 14px;
                text-align: center;
            }
            .footer {
                background-color: #F5EBD7;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            .footer p {
                margin: 5px 0;
                font-size: 12px;
                color: #999;
            }
            .custom-message {
                background-color: #f8f9fa;
                border-left: 4px solid #AA8E67;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
                font-style: italic;
                color: #4A4A4A;
            }
            @media (max-width: 480px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                .header, .content, .footer {
                    padding: 20px 15px;
                }
                .header h1 {
                    font-size: 20px;
                }
                .cta-button {
                    padding: 14px 24px;
                    font-size: 14px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Nayara Bocas del Toro</h1>
                <p>HR Portal Invitation</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Welcome to the Team!
                </div>
                
                <div class="message">
                    ${data.inviterName} has invited you to join the Nayara Bocas del Toro HR Portal. 
                    You've been assigned the role of <strong>${roleDisplayNames[data.role] || data.role}</strong>
                    ${data.departmentName ? ` in the <strong>${data.departmentName}</strong> department` : ''}.
                </div>

                ${data.message ? `
                <div class="custom-message">
                    <strong>Personal Message:</strong><br>
                    ${data.message}
                </div>
                ` : ''}
                
                <div class="invitation-details">
                    <div class="detail-row">
                        <span class="detail-label">Your Role:</span>
                        <span class="detail-value">${roleDisplayNames[data.role] || data.role}</span>
                    </div>
                    ${data.departmentName ? `
                    <div class="detail-row">
                        <span class="detail-label">Department:</span>
                        <span class="detail-value">${data.departmentName}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Invited By:</span>
                        <span class="detail-value">${data.inviterName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${data.email}</span>
                    </div>
                </div>
                
                <div class="cta-container">
                    <a href="${data.invitationUrl}" class="cta-button">
                        Accept Invitation & Setup Account
                    </a>
                </div>
                
                <div class="expiry-notice">
                    ⏰ This invitation will expire in ${data.expiryDays} days for security reasons.
                </div>
                
                <div class="message">
                    Once you accept this invitation, you'll have access to:
                    <ul style="margin-top: 15px; padding-left: 20px;">
                        <li>View and download important company documents</li>
                        <li>Access your payslips and salary information</li>
                        <li>Request vacation time and track your leave</li>
                        <li>Complete mandatory and optional training modules</li>
                        <li>Explore exclusive commercial benefits and discounts</li>
                        <li>Manage your personal profile and emergency contacts</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>If you have any questions, please contact HR or your department administrator.</p>
                <p>This is an automated message from the Nayara Bocas del Toro HR Portal.</p>
                <p>If you didn't expect this invitation, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
}