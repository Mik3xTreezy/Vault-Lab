import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Country code mapping for common variations
const COUNTRY_CODE_MAP: { [key: string]: string } = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Canada': 'CA',
  'Australia': 'AU',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Singapore': 'SG',
  'Hong Kong': 'HK',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Belgium': 'BE',
  'Ireland': 'IE',
  'New Zealand': 'NZ',
  'Israel': 'IL',
  'UAE': 'AE',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'India': 'IN',
  'China': 'CN',
  'Russia': 'RU',
  'Turkey': 'TR',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Portugal': 'PT',
  'Greece': 'GR',
  'South Africa': 'ZA',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Vietnam': 'VN',
  'Taiwan': 'TW'
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, cpmData } = await request.json()

    if (!taskId || !cpmData || !Array.isArray(cpmData)) {
      return NextResponse.json(
        { message: 'Invalid request data. taskId and cpmData array are required.' },
        { status: 400 }
      )
    }

    if (cpmData.length === 0) {
      return NextResponse.json(
        { message: 'No CPM data provided.' },
        { status: 400 }
      )
    }

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { message: 'Task not found.' },
        { status: 404 }
      )
    }

    let updatedCount = 0
    const errors: string[] = []

    // Process each country's CPM data
    for (const countryData of cpmData) {
      try {
        const { country, cpm, countryCode } = countryData

        if (!country || typeof cpm !== 'number' || cpm < 0) {
          errors.push(`Invalid data for country: ${country}`)
          continue
        }

        // Get country code (use provided or map from country name)
        const finalCountryCode = countryCode || COUNTRY_CODE_MAP[country] || country.toUpperCase().slice(0, 2)

        // For each device type, update the device targeting table
        const devices = ['Windows', 'MacOS', 'Android', 'iOS']
        
        for (const device of devices) {
          const key = `${device}_${finalCountryCode}`
          
          // Check if record exists
          const { data: existing } = await supabase
            .from('device_targeting')
            .select('*')
            .eq('key', key)
            .single()

          if (existing) {
            // Update existing record
            await supabase
              .from('device_targeting')
              .update({
                task_id: taskId,
                cpm: cpm,
                device: device,
                country: finalCountryCode,
                updated_at: new Date().toISOString()
              })
              .eq('key', key)
          } else {
            // Insert new record
            await supabase
              .from('device_targeting')
              .insert({
                key: key,
                device: device,
                country: finalCountryCode,
                task_id: taskId,
                cpm: cpm,
                ad_url: '', // Will be set separately if needed
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
          }
        }

        updatedCount++
      } catch (error) {
        console.error(`Error processing country ${countryData.country}:`, error)
        errors.push(`Failed to process ${countryData.country}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log the CSV upload activity
    await supabase
      .from('admin_logs')
      .insert({
        action: 'csv_upload',
        details: {
          taskId,
          taskTitle: task.title,
          countriesProcessed: updatedCount,
          totalCountries: cpmData.length,
          errors: errors.length > 0 ? errors : null
        },
        timestamp: new Date().toISOString()
      })

    const response = {
      message: `Successfully processed ${updatedCount} countries for task "${task.title}"`,
      updatedCount,
      totalCount: cpmData.length,
      errors: errors.length > 0 ? errors : null
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('CSV upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error during CSV upload.' },
      { status: 500 }
    )
  }
} 