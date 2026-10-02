import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const inputSchema = z.object({
  prompt: z.string().trim().min(3).max(4000),
  previousHtml: z.string().max(180000).optional(),
})

export const generateWebsite = createServerFn({ method: 'POST' })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY']
    if (!key) throw new Error('AI generation is not configured yet.')

    const system = `You are an expert web designer and frontend engineer. Create a COMPLETE, visually excellent, responsive website as ONE self-contained HTML document. Return ONLY HTML beginning with <!DOCTYPE html>; no markdown or explanations. Include CSS in <style> and JavaScript in <script> in the document. The result will run inside a sandboxed iframe. Do not use external libraries, CDNs, external images, iframes, remote fonts, or API calls. Use tasteful CSS illustration, gradients, patterns and typographic composition when visual media is needed. Build a REAL website, not a mobile app: desktop navigation, sections and layouts, responsive tablet/mobile breakpoints, semantic HTML and accessible labels. Make all visible interactions work locally: navigation anchors, menus, tabs, filters, forms with visible feedback, accordions, calculators, carts or other features appropriate to the request. No fake checkout/payment, login, database or server features. Never claim a form sends email. If a user asks for a change and previous HTML is provided, preserve its overall identity and existing useful behavior while applying the requested change. Keep it concise enough to render quickly (under 35,000 characters). Do not include surrounding commentary.`
    const user = data.previousHtml
      ? `Requested change: ${data.prompt}\n\nExisting website HTML to improve:\n${data.previousHtml.slice(0, 90000)}`
      : `Build this website: ${data.prompt}`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
      body: JSON.stringify({
        model: 'google/gemini-3.8-flash',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: 12000,
      }),
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error(`Website generation failed [${response.status}]: ${detail}`)
      if (response.status === 402) throw new Error('AI credits are used up. Add credits to continue.')
      if (response.status === 429) throw new Error('Too many requests. Please try again shortly.')
      throw new Error(`Website generation failed (${response.status}). Please try again.`)
    }
    const result = await response.json() as { choices?: { message?: { content?: string } }[] }
    const raw = result.choices?.[0]?.message?.content?.trim() ?? ''
    const html = raw.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim()
    if (!/^<!doctype html|^<html[\s>]/i.test(html) || !html.includes('</html>')) {
      throw new Error('The AI did not return a complete website. Please try again.')
    }
    return { html }
  })
