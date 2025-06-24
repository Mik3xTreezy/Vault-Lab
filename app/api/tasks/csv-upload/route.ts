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
    // Enhanced request body parsing with better error handling
    let body;
    let taskId;
    let cpmData;
    
    try {
      // First, get the raw text to debug potential issues
      const rawBody = await request.text();
      console.log('[CSV UPLOAD] Raw request body length:', rawBody.length);
      console.log('[CSV UPLOAD] Raw request body preview:', rawBody.substring(0, 200));
      
      // Try to parse the JSON
      body = JSON.parse(rawBody);
      taskId = body.taskId;
      cpmData = body.cpmData;
    } catch (parseError) {
      console.error('[CSV UPLOAD] JSON parsing error:', parseError);
      console.error('[CSV UPLOAD] Request headers:', Object.fromEntries(request.headers.entries()));
      
      return NextResponse.json(
        { 
          message: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          details: 'Please ensure the request body is valid JSON'
        },
        { status: 400 }
      )
    }

    console.log('[CSV UPLOAD] Received request:', { taskId, cpmDataLength: cpmData?.length })

    if (!taskId || !cpmData || !Array.isArray(cpmData)) {
      console.log('[CSV UPLOAD] Invalid request data:', { taskId, cpmData: typeof cpmData })
      return NextResponse.json(
        { message: 'Invalid request data. taskId and cpmData array are required.' },
        { status: 400 }
      )
    }

    if (cpmData.length === 0) {
      console.log('[CSV UPLOAD] No CPM data provided')
      return NextResponse.json(
        { message: 'No CPM data provided.' },
        { status: 400 }
      )
    }

    // First, let's see what tasks exist
    const { data: allTasks, error: allTasksError } = await supabase
      .from('tasks')
      .select('id, title')
      .order('id')
    
    console.log('[CSV UPLOAD] All available tasks:', allTasks)
    console.log('[CSV UPLOAD] Looking for task ID:', taskId, typeof taskId)

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', taskId)
      .single()

    console.log('[CSV UPLOAD] Task lookup result:', { task, taskError })

    if (taskError || !task) {
      console.log('[CSV UPLOAD] Task not found:', { taskId, taskError: taskError?.message })
      return NextResponse.json(
        { 
          message: `Task not found. Requested ID: ${taskId}, Available tasks: ${allTasks?.map(t => `${t.title}(${t.id})`).join(', ') || 'none'}` 
        },
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
          console.log(`[CSV UPLOAD] Processing ${device} for ${finalCountryCode} with CPM ${cpm}`)
          
          // Check if record exists using device, country, and task_id
          const { data: existing, error: existingError } = await supabase
            .from('device_targeting')
            .select('*')
            .eq('device', device)
            .eq('country', finalCountryCode)
            .eq('task_id', taskId)
            .maybeSingle()

          console.log(`[CSV UPLOAD] Existing record check:`, { existing, existingError })

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('device_targeting')
              .update({
                cpm: cpm,
                source: 'csv_upload', // Mark as CSV uploaded
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)
            
            if (updateError) {
              console.error(`[CSV UPLOAD] Update error for ${device}/${finalCountryCode}:`, updateError)
              errors.push(`Failed to update ${device}/${finalCountryCode}: ${updateError.message}`)
            } else {
              console.log(`[CSV UPLOAD] Updated ${device}/${finalCountryCode} with CPM ${cpm}`)
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('device_targeting')
              .insert({
                device: device,
                country: finalCountryCode,
                task_id: taskId,
                cpm: cpm,
                ad_url: '', // Will be set separately if needed
                source: 'csv_upload', // Mark as CSV uploaded
              })
            
            if (insertError) {
              console.error(`[CSV UPLOAD] Insert error for ${device}/${finalCountryCode}:`, insertError)
              errors.push(`Failed to insert ${device}/${finalCountryCode}: ${insertError.message}`)
            } else {
              console.log(`[CSV UPLOAD] Inserted ${device}/${finalCountryCode} with CPM ${cpm}`)
            }
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