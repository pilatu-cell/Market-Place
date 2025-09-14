import {config} from './config.js'


export async function sendMessage(phone_number, name, id) {
    const twilioNumber = 'whatsapp:+14155238886';
    const cellNo = `whatsapp:${phone_number}`;
    const accountSid = config.Twilio.acc_ssid 
    const authToken = config.Twilio.auth_token 
    const message = `Hi there ${name}, your id is ${id} and WELCOME to the comrades market. This is a community aimed at aiding the users with a platform to advertise and showcase their goods and services. Thank you for joining the community.`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    //console.log(accountSid, authToken, {email: config.email.user, pass: config.email.pass})

    const formData = new URLSearchParams();
    formData.append('From', twilioNumber);
    formData.append('To', cellNo);
    formData.append('Body', message);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (!response.ok) {
            throw new Error(`Twilio API error: ${response.status}`);
        }

        const data = await response.json();
        return { data, message: 'A WhatsApp message has been sent to your phone number' };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return { error: error.message };
    }
}

// Test Scenario
// sendMessage('+254710745780', 'Ninja')