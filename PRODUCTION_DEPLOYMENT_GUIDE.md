# 🚀 Guida Completa al Deployment in Produzione

## 📋 **Panoramica**

Questa guida ti accompagnerà attraverso tutti i passaggi necessari per portare VoyageSmart in produzione, dall'hosting al monitoring.

---

## 🏗️ **1. Preparazione Pre-Deployment**

### **A. Environment Variables**
Crea file `.env.production`:
```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://tuodominio.com
NODE_ENV=production

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Services
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key

# Email Service
RESEND_API_KEY=your-resend-key

# Maps
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
HOTJAR_ID=your-hotjar-id

# Security
CRON_API_KEY=your-secure-cron-key
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### **B. Build Test**
```bash
# Test build locale
npm run build
npm run start

# Verifica che tutto funzioni
# Test su http://localhost:3000
```

---

## 🌐 **2. Scelta Hosting Provider**

### **🥇 Opzione Consigliata: Vercel**

**Vantaggi:**
- Integrazione nativa Next.js
- Deploy automatico da Git
- Edge functions globali
- Analytics integrati
- SSL automatico
- CDN globale

**Pricing:**
- **Hobby:** Gratuito (limitazioni)
- **Pro:** $20/mese (raccomandato)
- **Team:** $99/mese

### **🥈 Alternative:**

#### **Netlify**
- Simile a Vercel
- Ottimo per siti statici
- $19/mese per Pro

#### **Railway**
- Ottimo per full-stack apps
- Database incluso
- $5-20/mese

#### **DigitalOcean App Platform**
- Più controllo
- $12-25/mese

#### **AWS Amplify**
- Scalabilità enterprise
- Più complesso da configurare

---

## 🚀 **3. Deployment su Vercel (Raccomandato)**

### **Step 1: Preparazione Repository**
```bash
# Assicurati che il codice sia su GitHub
git add .
git commit -m "Production ready"
git push origin main
```

### **Step 2: Connessione Vercel**
1. Vai su [vercel.com](https://vercel.com)
2. Registrati/Login con GitHub
3. Click "New Project"
4. Seleziona il repository VoyageSmart
5. Configura:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### **Step 3: Environment Variables**
Nel dashboard Vercel:
1. Settings → Environment Variables
2. Aggiungi tutte le variabili da `.env.production`
3. Seleziona "Production" environment

### **Step 4: Custom Domain**
1. Settings → Domains
2. Aggiungi il tuo dominio
3. Configura DNS:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### **Step 5: Deploy**
```bash
# Deploy automatico ad ogni push su main
git push origin main
```

---

## 🗄️ **4. Database Setup (Supabase Production)**

### **Step 1: Nuovo Progetto Supabase**
1. Vai su [supabase.com](https://supabase.com)
2. Crea nuovo progetto per produzione
3. Scegli regione più vicina ai tuoi utenti
4. Configura password sicura

### **Step 2: Migrazione Schema**
```sql
-- Esegui tutti i file di migrazione in ordine:
-- 1. supabase/schema.sql
-- 2. supabase/migrations/*.sql
-- 3. Configura RLS policies
-- 4. Crea storage buckets
```

### **Step 3: Backup Strategy**
```bash
# Setup backup automatici
# Supabase Pro include backup automatici
# Configura backup aggiuntivi se necessario
```

---

## 💳 **5. Stripe Production Setup**

### **Step 1: Account Stripe Live**
1. Attiva account Stripe Live
2. Completa verifica business
3. Ottieni chiavi Live

### **Step 2: Webhook Configuration**
```bash
# URL webhook per produzione:
https://tuodominio.com/api/stripe/webhook

# Eventi da ascoltare:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### **Step 3: Test Payments**
```bash
# Usa carte di test Stripe per verificare
# 4242 4242 4242 4242 (Visa)
# 4000 0000 0000 0002 (Declined)
```

---

## 📧 **6. Email Service Setup**

### **Resend (Raccomandato)**
1. Account su [resend.com](https://resend.com)
2. Verifica dominio
3. Configura DNS records:
   ```
   Type: TXT
   Name: @
   Value: resend-verification-code
   
   Type: MX
   Name: @
   Value: feedback-smtp.resend.com
   ```

### **Alternative:**
- **SendGrid:** $14.95/mese
- **Mailgun:** $35/mese
- **AWS SES:** Pay-per-use

---

## 🗺️ **7. Maps Service (Mapbox)**

### **Production Setup**
1. Account Mapbox Production
2. Configura rate limits
3. Aggiungi domini autorizzati
4. Monitor usage

**Pricing:** $0.50 per 1,000 requests

---

## 📊 **8. Monitoring & Analytics**

### **A. Error Monitoring - Sentry**
```bash
npm install @sentry/nextjs

# Configura sentry.client.config.js
# Configura sentry.server.config.js
```

### **B. Performance - Vercel Analytics**
```bash
npm install @vercel/analytics
npm install @vercel/speed-insights
```

### **C. User Analytics - Google Analytics**
```bash
npm install react-ga4
```

### **D. Uptime Monitoring**
**Opzioni:**
- **UptimeRobot:** Gratuito per 50 monitors
- **Pingdom:** $10/mese
- **StatusCake:** $24.99/mese

---

## 🔒 **9. Security Setup**

### **A. SSL Certificate**
- Automatico con Vercel
- Verifica HTTPS redirect

### **B. Security Headers**
```javascript
// Già configurato in next.config.js
// Verifica con securityheaders.com
```

### **C. Rate Limiting**
```bash
# Implementato nel middleware
# Monitor per abusi
```

---

## 🚀 **10. Performance Optimization**

### **A. CDN Configuration**
- Automatico con Vercel
- Verifica cache headers

### **B. Image Optimization**
```javascript
// next.config.js già configurato
// Verifica formati WebP/AVIF
```

### **C. Bundle Analysis**
```bash
npx @next/bundle-analyzer
```

---

## 📋 **11. Pre-Launch Checklist**

### **🔴 Critico:**
- [ ] Environment variables configurate
- [ ] Database migrato e testato
- [ ] Stripe webhooks funzionanti
- [ ] Email service attivo
- [ ] SSL certificate attivo
- [ ] Error monitoring configurato
- [ ] Backup strategy implementata

### **🟡 Importante:**
- [ ] Custom domain configurato
- [ ] Analytics implementati
- [ ] Performance audit completato
- [ ] Security headers verificati
- [ ] Uptime monitoring attivo

### **🟢 Nice-to-Have:**
- [ ] CDN ottimizzato
- [ ] SEO metadata completi
- [ ] Social media cards
- [ ] Favicon configurato

---

## 🎯 **12. Post-Launch**

### **Settimana 1:**
- Monitor errori e performance
- Verifica funzionalità critiche
- Raccolta feedback utenti
- Ottimizzazioni immediate

### **Settimana 2-4:**
- Analisi metriche
- Ottimizzazioni performance
- Feature improvements
- Scaling se necessario

---

## 💰 **13. Costi Stimati Mensili**

### **Setup Base:**
- **Hosting (Vercel Pro):** $20
- **Database (Supabase Pro):** $25
- **Email (Resend):** $20
- **Maps (Mapbox):** $10-50
- **Monitoring (Sentry):** $26
- **Domain:** $10-15/anno

**Totale:** ~$100-130/mese

### **Scaling (1000+ utenti):**
- **Hosting:** $20-100
- **Database:** $25-100
- **Email:** $20-100
- **Maps:** $50-200
- **Monitoring:** $26-100

**Totale:** ~$150-500/mese

---

## 🆘 **14. Support & Troubleshooting**

### **Risorse:**
- Vercel Documentation
- Supabase Documentation
- Next.js Documentation
- Community Discord/Forums

### **Emergency Contacts:**
- Hosting: Vercel Support
- Database: Supabase Support
- Payments: Stripe Support

---

**🎉 Congratulazioni! La tua app è pronta per la produzione!**
