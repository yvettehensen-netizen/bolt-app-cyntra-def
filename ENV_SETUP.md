# Environment Setup Guide

## Required Environment Variables

### Supabase (Required)

These are already configured in `.env`:

```env
VITE_SUPABASE_URL=https://ynqdybfppcwkuxalsidt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### OpenAI API Key (Optional)

To enable AI-powered analysis, add to `.env`:

```env
VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

**Without OpenAI Key:**
- Application uses intelligent mock analysis
- Analysis is deterministic based on input parameters
- Fully functional for testing and development

**With OpenAI Key:**
- Uses GPT-4o-mini for real AI analysis
- Contextual, personalized strategic advice
- Natural language generation

## Database Setup

The database migration has been created at:
`supabase/migrations/20251017130000_update_quickscan_responses.sql`

### To Apply Migration:

You can apply the migration using the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL

Or use the Supabase CLI:

```bash
supabase db push
```

## Testing the Application

### 1. Sign Up / Login
- Navigate to the app
- Create a new account or login
- You'll be redirected to the dashboard

### 2. Create a Quickscan
- Click "Nieuwe Quickscan starten"
- Fill in all required fields
- Click "Analyse Uitvoeren"
- Wait for AI analysis (or mock analysis if no API key)
- View the generated report

### 3. View Previous Scans
- Dashboard shows table of all previous scans
- Click "View" to see full report
- Reports are persisted in database

## OpenAI API Key Setup

If you want to use real AI analysis:

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add to `.env`: `VITE_OPENAI_API_KEY=sk-proj-...`
3. Restart the development server
4. The app will automatically detect the key and use OpenAI

## Troubleshooting

### "Alle velden zijn verplicht" error
- Ensure all form fields are filled
- Check that selections from dropdowns are made

### "Rapport niet gevonden" error
- Ensure RLS policies are correctly set up
- Check that user is authenticated
- Verify the report ID exists in database

### Analysis fails with error
- If OpenAI key is invalid, app falls back to mock
- Check browser console for detailed error messages
- Verify API key format: should start with `sk-`

### Authentication issues
- Clear browser cache and cookies
- Check Supabase dashboard for user records
- Verify RLS policies are enabled

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Database Schema Verification

Check that the following table exists in Supabase:

```sql
SELECT * FROM quickscan_responses LIMIT 1;
```

Check RLS policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'quickscan_responses';
```

You should see 3 policies:
1. Users can insert own quickscan responses
2. Users can view own quickscan responses
3. Users can update own quickscan responses
