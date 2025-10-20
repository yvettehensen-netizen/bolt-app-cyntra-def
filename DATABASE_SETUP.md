# Database Setup Instructions

De Quickscan analyse werkt pas nadat de database tabel is aangemaakt.

## ⚠️ Probleem

De tabel `quickscan_responses` bestaat nog niet in de Supabase database. Dit moet handmatig worden aangemaakt.

## ✅ Oplossing: Voer de Migratie Uit

### Optie 1: Via Supabase Dashboard (Aanbevolen)

1. **Open Supabase Dashboard**
   - Ga naar https://supabase.com/dashboard
   - Log in met je account
   - Selecteer je project

2. **Open SQL Editor**
   - Klik in het linker menu op "SQL Editor"
   - Klik op "New query"

3. **Kopieer en Plak de Migratie SQL**
   - Open het bestand: `supabase/migrations/20251017130000_update_quickscan_responses.sql`
   - Kopieer de volledige inhoud
   - Plak in de SQL Editor

4. **Voer de Query Uit**
   - Klik op "Run" (of druk op Ctrl/Cmd + Enter)
   - Wacht tot de query succesvol is uitgevoerd
   - Je zou moeten zien: "Success. No rows returned"

5. **Verifieer de Tabel**
   - Ga naar "Table Editor" in het linker menu
   - Je zou nu de tabel `quickscan_responses` moeten zien

### Optie 2: Via Supabase CLI

Als je de Supabase CLI hebt geïnstalleerd:

```bash
# Zorg dat je bent ingelogd
supabase login

# Link het project (eerste keer)
supabase link --project-ref ynqdybfppcwkuxalsidt

# Push de migraties
supabase db push
```

## 📋 Migratie SQL (Quick Reference)

De migratie maakt de volgende tabel aan:

```sql
CREATE TABLE quickscan_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bedrijfsnaam text NOT NULL,
  sector text NOT NULL,
  omzet_range text NOT NULL,
  aantal_ftes text NOT NULL,
  data_maturiteit text NOT NULL,
  hoofdknelpunt text NOT NULL,
  doel_analyse text NOT NULL,
  numerieke_score integer NOT NULL,
  sterktes text[] NOT NULL DEFAULT '{}',
  verbeterpunten text[] NOT NULL DEFAULT '{}',
  advies text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

Plus Row Level Security (RLS) policies voor veilige data toegang.

## ✅ Test na Installatie

1. **Log in op de applicatie**
2. **Ga naar Quickscan pagina**
3. **Vul het formulier in**
4. **Klik op "Analyse Uitvoeren"**
5. **Je zou nu naar een rapport pagina moeten worden doorverwezen**

## 🔧 Troubleshooting

### Fout: "Could not find the table 'public.quickscan_responses'"
- **Oorzaak**: De migratie is nog niet uitgevoerd
- **Oplossing**: Volg de stappen hierboven om de migratie uit te voeren

### Fout: "permission denied for table quickscan_responses"
- **Oorzaak**: RLS policies zijn niet correct ingesteld
- **Oplossing**: Voer de volledige migratie opnieuw uit (inclusief DROP TABLE IF EXISTS)

### Fout: "foreign key constraint violation"
- **Oorzaak**: De user_id bestaat niet in auth.users
- **Oplossing**: Zorg dat je bent ingelogd met een geldige user account

## 📞 Hulp Nodig?

Als je problemen ondervindt:
1. Check de browser console voor gedetailleerde error messages
2. Verifieer dat alle environment variables correct zijn ingesteld (zie `/env` pagina als admin)
3. Controleer de Supabase dashboard logs voor database errors
