---
title: Waypoint Extension
description: A private Awell extension that provides seamless integration with Google BigQuery, enabling powerful data querying and analysis capabilities within Awell care flows.
---

# Waypoint Extension

The Waypoint extension enables seamless integration between Awell and Google BigQuery, allowing care flows to directly query and analyze data from BigQuery datasets. This integration is particularly useful for scenarios where you need to incorporate data analysis, reporting, or data-driven decision making into your care flows.

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

The extension requires the following setting:

- `gcp_sa_b64`: Base64-encoded GCP service account key
  - Must have permissions to access BigQuery
  - Should be kept secure and never exposed in logs or client-side code
  - Can be rotated as needed through GCP console

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

The extension includes comprehensive tests covering:
- Default query execution
- Custom query execution
- Error handling for invalid credentials
- Error handling for failed queries

### Best Practices

1. **Query Optimization**
   - Use appropriate LIMIT clauses to control data volume
   - Consider cost implications of complex queries
   - Use appropriate WHERE clauses to filter data

2. **Security**
   - Rotate service account keys regularly
   - Use minimal required permissions for the service account
   - Never expose credentials in logs or client-side code

3. **Error Handling**
   - Always handle potential query failures in your care flows
   - Consider retry strategies for transient failures
   - Log relevant error details for debugging

## Deployment

The extension is automatically published to NPM and deployed to the extension server when changes are merged to the main branch. This process includes:

1. Running all tests
2. Building the package
3. Publishing to NPM
4. Deploying to the extension server
5. Creating a release tag
