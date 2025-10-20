# Twilio SMS Verification Setup

## Setup Steps

### 1. Create Twilio Account
1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for a free account
3. Verify your email and phone number

### 2. Get Account Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID** and **Auth Token**
3. Add to `.env`:
```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
```

### 3. Get a Phone Number
1. Go to Phone Numbers → Manage → Buy a number
2. Select a number with SMS capability
3. Add to `.env`:
```env
   TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Create Verify Service (Recommended)
1. Go to Verify → Services
2. Create a new service named "Roommate Finder"
3. Copy the Service SID
4. Add to `.env`:
```env
   TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Features

### Phone Verification
```bash
# Send verification code
POST /api/v1/auth/phone/send-code
{
  "phoneNumber": "+1234567890"
}

# Verify code
POST /api/v1/auth/phone/verify
{
  "code": "123456"
}
```

### SMS Login
```bash
# Send login OTP
POST /api/v1/auth/phone/login/send-otp
{
  "phoneNumber": "+1234567890"
}

# Verify login OTP
POST /api/v1/auth/phone/login/verify-otp
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

## Development Mode

When Twilio is not configured, the system will:
- Generate OTP codes
- Log them to the console
- Store them in memory for verification
- Work without actual SMS sending

## Phone Number Format

All phone numbers must be in **E.164 format**:
- Start with `+`
- Include country code
- No spaces, dashes, or parentheses

Examples:
- US: `+12025551234`
- UK: `+447911123456`
- Nigeria: `+2348012345678`

## Cost Estimation

### Free Tier
- $15.50 trial credit
- ~500 SMS messages

### Production Costs
- SMS: $0.0075 - $0.02 per message
- Verify API: $0.05 per verification
- Phone Number: $1.00/month

## Security Best Practices

1. **Rate Limiting**: Already implemented
2. **OTP Expiration**: 10 minutes
3. **One-time Use**: Codes deleted after verification
4. **Secure Storage**: Never log actual codes in production
5. **Phone Verification**: Required before sensitive operations

## Testing
```javascript
// Test in development
const response = await fetch('http://localhost:5000/api/v1/auth/phone/send-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890'
  })
});

// Check server logs for OTP code in development
// In production, check your phone
```

## Troubleshooting

### Error: "Invalid phone number format"
- Ensure E.164 format: `+[country code][number]`
- Example: `+12025551234` (US), not `(202) 555-1234`

### Error: "SMS service not configured"
- Check `.env` file has Twilio credentials
- Restart server after adding credentials

### Code not received
- Check Twilio console for delivery status
- Verify phone number is correct
- Check if number is on Do Not Call list
- Ensure sufficient Twilio balance

### Development Mode
- OTP codes logged to console when Twilio not configured
- Check terminal output for codes
- Useful for testing without SMS credits