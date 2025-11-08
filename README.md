---
title: Waypoint Extension
description: A private Awell extension that provides seamless integration with Google BigQuery and Text-em-all, enabling powerful data querying and SMS communication capabilities within Awell care flows.
---

# Waypoint Extension

The Waypoint extension enables seamless integration between Awell and multiple services:
- **Google BigQuery**: Query and analyze data from BigQuery datasets
- **Text-em-all**: Send SMS messages to patients with intelligent scheduling

This integration is particularly useful for scenarios where you need to incorporate data analysis, automated communications, or data-driven decision making into your care flows.

## Setup

### Google Cloud Platform Setup

Before using this extension, you'll need to:

1. Create a Google Cloud Platform (GCP) project
2. Enable the BigQuery API
3. Create a service account with appropriate BigQuery permissions
4. Generate and download the service account key
5. Base64 encode the service account key JSON file

You can base64 encode your service account key using:
```bash
cat service-account-key.json | base64
```

### Extension Settings

The extension requires the following settings:

#### BigQuery Settings
- `gcp_sa_b64`: Base64-encoded GCP service account key
  - Must have permissions to access BigQuery
  - Should be kept secure and never exposed in logs or client-side code
  - Can be rotated as needed through GCP console

#### Text-em-all Settings (Optional - only required for SMS actions)
- `textemall_consumer_key`: OAuth 1.0 consumer key for Text-em-all
- `textemall_consumer_secret`: OAuth 1.0 consumer secret for Text-em-all
- `textemall_oauth_token`: OAuth 1.0 token for Text-em-all
- `textemall_token_secret`: OAuth 1.0 token secret for Text-em-all
- `textemall_base_url`: Text-em-all API base URL (typically `https://rest.text-em-all.com/v1/broadcasts`)

To obtain Text-em-all OAuth credentials:
1. Log in to your Text-em-all account
2. Navigate to API settings
3. Generate OAuth 1.0 credentials
4. Copy the consumer key, consumer secret, token, and token secret

## Actions

### BigQuery Query

This action allows you to execute queries against BigQuery datasets and retrieve the results as JSON data points.

#### Configuration Fields

**Required Fields:**
- `bigquery_dataset`: The BigQuery dataset to query
- `bigquery_table`: The BigQuery table to query

**Optional Fields:**
- `query`: Custom SQL query to execute
  - If not provided, defaults to a simple query (`SELECT * FROM \`dataset.table\` LIMIT 10`).
  - Can include any valid BigQuery SQL syntax
  - Supports complex queries including JOINs, aggregations, and window functions

#### Data Points

The action returns:
- `bigquery_result`: JSON string containing the query results
  - For default queries: First 10 rows of the specified table
  - For custom queries: All rows returned by the query

#### Example Usage

1. **Default Query (Sample Data)**
   ```sql
   -- Automatically generated when no query is provided
   SELECT * FROM `your_dataset.your_table` LIMIT 10
   ```

2. **Custom Query (Aggregation)**
   ```sql
   SELECT 
     date,
     COUNT(*) as event_count,
     AVG(value) as avg_value
   FROM `your_dataset.your_table`
   GROUP BY date
   ORDER BY date DESC
   ```

#### Error Handling

The action handles several error scenarios:
- Invalid GCP credentials
- Missing or invalid dataset/table names
- SQL syntax errors
- Query execution failures
- Permission issues

Each error is properly caught and reported back to the care flow for appropriate handling.

---

### Send Text-em-all Text

This action sends an SMS message to a patient via Text-em-all with intelligent scheduling based on business hours (Central Time). Messages are automatically scheduled for 11 AM on the next available workday.

#### Configuration Fields

**Required Fields:**
- `textMessage`: The message content to send (supports HTML formatting)
- `textNumberID`: The Text-em-all phone number ID to send from
- `patientTextNumber`: The patient's phone number (E.164 format recommended, e.g., `+1-555-123-4567`)

**Patient Information:**
The action automatically pulls the following from the patient context:
- `first_name`: Patient's first name
- `last_name`: Patient's last name
- `identifier`: Patient account ID (from Resource Corp system if available)

#### Scheduling Logic

Messages are intelligently scheduled based on Central Time:
- **Before 10 AM on a weekday**: Scheduled for 11 AM today
- **After 10 AM on a weekday**: Scheduled for 11 AM the next workday
- **Weekends**: Scheduled for 11 AM the following Monday

This ensures messages are sent during appropriate business hours.

#### Data Points

The action returns:
- `broadcast_id`: Text-em-all broadcast ID for tracking
- `broadcast_name`: Name of the broadcast (includes patient identifier)
- `start_date`: Scheduled send date/time in format `MM/DD/YYYY 11AM`

#### Example Usage

**Basic SMS:**
```yaml
textMessage: "<p>Hello! Please complete your eligibility form at: https://example.com/form</p>"
textNumberID: "151220"
patientTextNumber: "+1-555-123-4567"
```

**Using Patient Data:**
The patient's name and account ID are automatically included in the broadcast metadata for tracking purposes.

#### OAuth 1.0 Authentication

This action uses OAuth 1.0 with HMAC-SHA1 signatures to authenticate with Text-em-all:
- Signatures are automatically generated for each request
- Timestamps and nonces ensure request uniqueness
- All OAuth parameters are properly encoded per RFC 3986

#### Error Handling

The action handles several error scenarios:
- Invalid Text-em-all credentials
- API rate limits or service errors
- Invalid phone numbers
- Network connectivity issues

Each error is properly caught and reported back to the care flow for appropriate handling.

---

### Create Next Workdate

This helper action calculates the next available workdate based on Central Time business hours. It's used internally by the Text-em-all action but can also be used standalone for scheduling logic.

#### Configuration Fields

No input fields required - uses current time.

#### Scheduling Logic

Returns a date string based on Central Time:
- **Before 10 AM on a weekday**: Returns today at 11 AM
- **After 10 AM on a weekday**: Returns the next workday at 11 AM
- **Weekends**: Returns the following Monday at 11 AM

#### Data Points

The action returns:
- `next_workdate`: Date string in format `MM/DD/YYYY 11AM`

#### Example Usage

Use this action when you need to:
- Calculate scheduling times for other actions
- Determine next business day for appointments
- Validate business hours in care flows

---

## Development

### Prerequisites
- Node.js >= 20
- Yarn package manager
- Access to a Google Cloud Platform project with BigQuery enabled

### Local Setup
```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Build the extension
yarn build
```

### Testing

The extension includes comprehensive test coverage:

#### Unit Tests
- Default BigQuery query execution
- Custom BigQuery query execution
- Text-em-all SMS sending with various scenarios
- Workdate calculation for different times and days
- OAuth 1.0 signature generation

#### Integration Tests
- Error handling for invalid credentials
- Error handling for failed queries
- Date/time calculations across timezones
- Weekend and holiday handling

Run tests with:
```bash
# Run all tests
yarn test

# Run local integration tests (requires real credentials in .env)
yarn test:local
```

For local integration testing, create a `.env` file with real Text-em-all credentials:
```env
TEXTEMALL_CONSUMER_KEY=your-consumer-key
TEXTEMALL_CONSUMER_SECRET=your-consumer-secret
TEXTEMALL_OAUTH_TOKEN=your-oauth-token
TEXTEMALL_TOKEN_SECRET=your-token-secret
TEXTEMALL_TEXT_NUMBER_ID=your-phone-number-id
TEST_PHONE_NUMBER=+1-555-123-4567
```

### Best Practices

#### BigQuery

1. **Query Optimization**
   - Use appropriate LIMIT clauses to control data volume
   - Consider cost implications of complex queries
   - Use appropriate WHERE clauses to filter data

2. **Security**
   - Rotate service account keys regularly
   - Use minimal required permissions for the service account
   - Never expose credentials in logs or client-side code

#### Text-em-all

1. **Phone Number Formatting**
   - Use E.164 format for best compatibility (`+1-555-123-4567`)
   - Validate phone numbers before sending
   - Handle international numbers appropriately

2. **Message Content**
   - Keep messages concise and actionable
   - Include clear call-to-action with links
   - Test HTML rendering on different devices
   - Comply with SMS regulations (TCPA, GDPR, etc.)

3. **Scheduling**
   - Leverage automatic business hours scheduling
   - Consider time zones for multi-region deployments
   - Test weekend and holiday scenarios

4. **Security**
   - Rotate OAuth credentials regularly
   - Monitor API usage and rate limits
   - Never expose credentials in logs or client-side code

#### General

1. **Error Handling**
   - Always handle potential failures in your care flows
   - Consider retry strategies for transient failures
   - Log relevant error details for debugging
   - Implement fallback communication methods

## Deployment

The extension is automatically published to NPM and deployed to the extension server when changes are merged to the main branch. This process includes:

1. Running all tests
2. Building the package
3. Publishing to NPM
4. Deploying to the extension server
5. Creating a release tag
