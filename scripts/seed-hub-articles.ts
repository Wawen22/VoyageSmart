import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleArticles = [
  {
    slug: 'ultimate-guide-to-planning-your-first-european-adventure',
    title: 'Ultimate Guide to Planning Your First European Adventure',
    subtitle: 'Everything you need to know for an unforgettable European journey',
    excerpt: 'Planning your first trip to Europe can be overwhelming. This comprehensive guide covers everything from choosing destinations to booking accommodations, helping you create the perfect European adventure.',
    content: `# Introduction

Planning your first European adventure is an exciting milestone! With so many incredible destinations, rich history, and diverse cultures, Europe offers something for every traveler. This guide will walk you through everything you need to know to plan an unforgettable trip.

## Choosing Your Destinations

### Start with Your Interests

Europe is vast and diverse. Consider what excites you most:
- **History buffs**: Rome, Athens, Berlin
- **Art lovers**: Paris, Florence, Amsterdam
- **Nature enthusiasts**: Swiss Alps, Norwegian Fjords, Scottish Highlands
- **Food lovers**: Barcelona, Lyon, Bologna

### Consider the Season

Different seasons offer unique experiences:
- **Spring (April-May)**: Mild weather, fewer crowds, blooming flowers
- **Summer (June-August)**: Peak season, warm weather, all attractions open
- **Fall (September-October)**: Beautiful foliage, harvest festivals, moderate crowds
- **Winter (November-March)**: Christmas markets, skiing, budget-friendly

## Budgeting Your Trip

### Average Daily Costs

- **Budget travelers**: €50-80 per day
- **Mid-range travelers**: €100-150 per day
- **Luxury travelers**: €200+ per day

### Money-Saving Tips

1. Book flights 2-3 months in advance
2. Use budget airlines for inter-European travel
3. Stay in hostels or Airbnb
4. Cook some meals yourself
5. Get a rail pass if visiting multiple countries

## Transportation

### Getting Around Europe

- **Trains**: Comfortable, scenic, and efficient
- **Budget Airlines**: Ryanair, EasyJet, Wizz Air
- **Buses**: FlixBus offers affordable long-distance travel
- **Car Rental**: Great for rural areas and flexibility

## Accommodation Options

### Types of Accommodation

1. **Hostels**: Budget-friendly, social atmosphere
2. **Hotels**: Comfort and convenience
3. **Airbnb**: Local experience, often with kitchen
4. **Guesthouses**: Personal touch, local insights

## Essential Tips

### Before You Go

- Check visa requirements
- Get travel insurance
- Notify your bank of travel plans
- Download offline maps
- Learn basic phrases in local languages

### Packing Essentials

- Comfortable walking shoes
- Universal power adapter
- Portable charger
- Light layers for varying weather
- Day backpack

## Conclusion

Your first European adventure will be an incredible experience filled with new discoveries, amazing food, and unforgettable memories. Take your time planning, but don't stress too much – some of the best travel moments are unplanned!

Ready to start planning? Use VoyageSmart to organize your itinerary, track expenses, and collaborate with travel companions.`,
    featured_image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=630&fit=crop',
    author_name: 'Sarah Johnson',
    author_email: 'sarah@voyagesmart.app',
    author_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    category: 'destinations',
    tags: ['europe', 'planning', 'first-time', 'budget', 'guide'],
    status: 'published',
    is_featured: true,
    seo_title: 'Ultimate Guide to Planning Your First European Adventure | VoyageSmart',
    seo_description: 'Complete guide for first-time travelers to Europe. Learn how to choose destinations, budget your trip, find accommodation, and make the most of your European adventure.',
    seo_keywords: ['europe travel guide', 'first time europe', 'european vacation planning', 'europe itinerary', 'budget europe travel']
  },
  {
    slug: '10-essential-travel-apps-every-smart-traveler-needs-in-2025',
    title: '10 Essential Travel Apps Every Smart Traveler Needs in 2025',
    subtitle: 'Stay organized, save money, and travel smarter with these must-have apps',
    excerpt: 'From navigation to language translation, these 10 essential apps will transform your travel experience and help you navigate any destination with confidence.',
    content: `# The Digital Travel Toolkit

In 2025, your smartphone is your most valuable travel companion. These 10 essential apps will help you navigate, communicate, save money, and stay organized throughout your journey.

## 1. VoyageSmart - Trip Planning & Organization

**Why you need it**: All-in-one trip planning platform
- Create detailed itineraries
- Track expenses in real-time
- Collaborate with travel companions
- Store important documents
- Offline access to your plans

## 2. Google Maps - Navigation

**Why you need it**: Best overall navigation app
- Offline maps
- Public transit directions
- Real-time traffic updates
- Save favorite places
- Share your location

## 3. Google Translate - Language Barrier Breaker

**Why you need it**: Communicate anywhere
- Text translation in 100+ languages
- Camera translation for signs and menus
- Conversation mode for real-time dialogue
- Offline translation packs
- Handwriting recognition

## 4. XE Currency - Money Converter

**Why you need it**: Never get confused by exchange rates
- Real-time exchange rates
- Offline mode
- Historical charts
- Calculator function
- 180+ currencies

## 5. Hopper - Flight & Hotel Deals

**Why you need it**: Save money on bookings
- Price predictions
- Deal alerts
- Flexible date search
- Price freeze feature
- Hotel and flight bundles

## 6. Rome2Rio - Multi-Modal Journey Planner

**Why you need it**: Find the best route anywhere
- Compare all transport options
- See costs and travel times
- Book directly through the app
- Works worldwide
- Offline saved routes

## 7. TripIt - Itinerary Organizer

**Why you need it**: Keep all bookings in one place
- Auto-import confirmations
- Unified itinerary view
- Share plans with others
- Real-time flight alerts
- Offline access

## 8. Trail Wallet - Expense Tracker

**Why you need it**: Stay on budget
- Simple expense logging
- Multiple currencies
- Daily budget tracking
- Visual spending reports
- Export data

## 9. Citymapper - Urban Navigation

**Why you need it**: Master public transit
- Real-time transit info
- Step-by-step directions
- Disruption alerts
- Compare route options
- Works in 100+ cities

## 10. AllTrails - Hiking & Outdoor Adventures

**Why you need it**: Explore nature safely
- 400,000+ trail maps
- Offline maps
- GPS tracking
- Trail reviews and photos
- Difficulty ratings

## Bonus Tips

### App Management

- Download apps before your trip
- Enable offline features
- Update apps regularly
- Check data usage settings
- Bring a portable charger

### Data & Connectivity

- Get a local SIM or eSIM
- Use WiFi when available
- Download offline content
- Enable data-saving modes
- Consider a VPN for security

## Conclusion

These apps will make your travels smoother, safer, and more enjoyable. Download them before your next trip and take some time to familiarize yourself with their features. Happy travels!`,
    featured_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=630&fit=crop',
    author_name: 'Michael Chen',
    author_email: 'michael@voyagesmart.app',
    author_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    category: 'planning-tools',
    tags: ['apps', 'technology', 'planning', 'tools', 'mobile'],
    status: 'published',
    is_featured: false,
    seo_title: '10 Essential Travel Apps for 2025 | Smart Traveler Guide',
    seo_description: 'Discover the must-have travel apps for 2025. From navigation to budgeting, these apps will transform your travel experience.',
    seo_keywords: ['travel apps 2025', 'best travel apps', 'trip planning apps', 'navigation apps', 'travel technology']
  },
  {
    slug: 'new-visa-requirements-for-us-travelers-what-you-need-to-know',
    title: 'New Visa Requirements for US Travelers: What You Need to Know',
    subtitle: 'Important updates on visa policies and entry requirements for 2025',
    excerpt: 'Stay informed about the latest visa requirements and entry regulations for US travelers. Learn which countries require visas, how to apply, and what documents you need.',
    content: `# 2025 Visa Requirements Update

Traveling internationally requires staying up-to-date with visa requirements. Here's everything US travelers need to know about visa policies in 2025.

## Major Changes in 2025

### ETIAS for Europe (Starting May 2025)

The European Travel Information and Authorization System (ETIAS) is now required for US citizens visiting Schengen Area countries.

**Key Details:**
- Cost: €7 (approximately $8)
- Valid for: 3 years or until passport expires
- Processing time: Usually instant, up to 96 hours
- Required for: All Schengen Area countries
- Application: Online only

### UK Electronic Travel Authorization (ETA)

**Requirements:**
- Cost: £10 (approximately $13)
- Valid for: 2 years
- Processing: Usually within 3 days
- Application: Mobile app or website

## Visa-Free Destinations

### No Visa Required (90 days or less)

- **Europe**: Most EU countries (with ETIAS)
- **Americas**: Canada, Mexico, most Caribbean islands
- **Asia**: Japan, South Korea, Singapore, Malaysia
- **Oceania**: Australia (with ETA), New Zealand

## Popular Destinations Requiring Visas

### Tourist Visa Required

1. **China**
   - Processing time: 4-5 business days
   - Cost: $140
   - Validity: 10 years, multiple entry

2. **India**
   - e-Visa available
   - Cost: $25-100 depending on duration
   - Processing: 3-5 business days

3. **Russia**
   - Tourist visa required
   - Cost: $160
   - Processing: 4-20 business days
   - Requires invitation letter

4. **Brazil**
   - e-Visa available
   - Cost: $80
   - Valid: 2 years
   - Processing: 5 business days

## Application Tips

### General Guidelines

1. **Apply Early**: Start visa applications 2-3 months before travel
2. **Check Validity**: Ensure passport is valid for 6 months beyond travel dates
3. **Blank Pages**: Have at least 2-3 blank pages in your passport
4. **Documentation**: Keep copies of all applications and confirmations
5. **Travel Insurance**: Some countries require proof of travel insurance

### Required Documents (Typical)

- Valid passport
- Completed application form
- Passport-sized photos
- Proof of accommodation
- Return flight tickets
- Bank statements
- Travel insurance
- Invitation letter (if applicable)

## Visa on Arrival

### Countries Offering VOA for US Citizens

- **Egypt**: $25, 30 days
- **Jordan**: $56, 30 days
- **Cambodia**: $30, 30 days
- **Laos**: $30-42, 30 days
- **Nepal**: $30-125, 15-90 days

## Important Reminders

### Before You Travel

- Check current requirements on official government websites
- Register with STEP (Smart Traveler Enrollment Program)
- Make copies of important documents
- Check COVID-19 requirements
- Verify passport expiration date

### During Travel

- Keep visa documents accessible
- Don't overstay your visa
- Follow local laws and regulations
- Keep embassy contact information handy

## Resources

### Official Sources

- **US State Department**: travel.state.gov
- **Embassy Websites**: Check specific country embassy sites
- **IATA Travel Centre**: iatatravelcentre.com
- **VoyageSmart**: Track visa requirements for your destinations

## Conclusion

Visa requirements can change frequently, so always verify current requirements before booking your trip. Use VoyageSmart to keep track of visa deadlines and required documents for all your destinations.

Stay informed, plan ahead, and enjoy your travels!`,
    featured_image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=630&fit=crop',
    author_name: 'David Martinez',
    author_email: 'david@voyagesmart.app',
    author_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    category: 'news-updates',
    tags: ['visa', 'requirements', 'travel-documents', 'regulations', 'etias'],
    status: 'published',
    is_featured: true,
    seo_title: 'New Visa Requirements for US Travelers 2025 | Complete Guide',
    seo_description: 'Stay updated on the latest visa requirements for US travelers in 2025, including ETIAS, UK ETA, and visa-free destinations.',
    seo_keywords: ['visa requirements 2025', 'ETIAS', 'US travelers', 'travel documents', 'visa application']
  }
];

// Helper function to calculate read time
function calculateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  const readTime = Math.ceil(words / 200);
  return Math.max(readTime, 1);
}

async function seedArticles() {
  console.log('Starting to seed articles...');

  for (const article of sampleArticles) {
    try {
      // Add calculated fields
      const articleWithMeta = {
        ...article,
        read_time_minutes: calculateReadTime(article.content),
        published_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('articles')
        .insert([articleWithMeta])
        .select()
        .single();

      if (error) {
        console.error(`Error inserting article "${article.title}":`, error);
      } else {
        console.log(`✓ Successfully inserted: ${article.title}`);
      }
    } catch (error) {
      console.error(`Exception inserting article "${article.title}":`, error);
    }
  }

  console.log('Seeding complete!');
}

seedArticles();

