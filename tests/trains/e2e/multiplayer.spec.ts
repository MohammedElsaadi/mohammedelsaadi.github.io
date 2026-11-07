import { chromium, expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ServerMessage, Snapshot } from '../../../shared/trains/types'
import { nextTestAction } from '../policy'
import { CITY_BY_ID, ROUTES } from '../../../shared/trains/board-data'
import { trackSlots } from '../../../src/features/trains/board3d/geometry'
import { boardCameraFraming, CAMERA_OFFSET } from '../../../src/features/trains/board3d/camera-settings'
import { OrthographicCamera, Vector3 } from 'three'

test('two isolated browsers play a whole game, rejoin mid-draw, and revoke a taken-over seat', async ({ page }) => {
  const secondBrowser = await chromium.launch({ channel: 'msedge' })
  const guest = await secondBrowser.newPage({ viewport: { width:1440,height:960 } })
  const views = new Map<Page,Snapshot>(), errors:string[] = []
  for (const target of [page,guest]) {
    target.on('pageerror', error => errors.push(error.message))
    target.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    target.on('websocket', socket => socket.on('framereceived', frame => {
      try { const message = JSON.parse(String(frame.payload)) as ServerMessage; if (message.type === 'JOINED' || message.type === 'SNAPSHOT') views.set(target,message) } catch { /* pong */ }
    }))
  }
  try {
    await page.goto('/games/trains'); await page.getByLabel('Your nickname').fill('Alice'); await page.getByRole('button',{name:'Create a table',exact:true}).click()
    await expect(page.getByRole('heading',{name:'The departure lounge'})).toBeVisible()
    await guest.goto(page.url()); await guest.getByLabel('Your nickname').fill('Bob'); await guest.getByRole('button',{name:'Join table',exact:true}).click()
    await expect(page.getByText('Bob',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Start journey',exact:true}).click()
    for (const target of [page,guest]) { await expect(target.getByRole('heading',{name:'Which journeys will you take?'})).toBeVisible(); await target.getByRole('button',{name:'Keep 3 tickets',exact:true}).click() }
    await expect.poll(() => views.get(page)?.public.phase).toBe('PLAYING')
    await expect(page.locator('.rail-board-canvas canvas')).toBeVisible()
    let rejoined = false, actions = 0, claims = 0
    while (views.get(page)?.public.phase !== 'COMPLETED' && actions++ < 600) {
      await expect.poll(() => views.get(page)?.stateVersion === views.get(guest)?.stateVersion).toBe(true)
      const latest = views.get(page)!, current = [page,guest].find(target => views.get(target)?.private.playerId === latest.public.currentPlayerId)!
      const view = views.get(current)!, action = nextTestAction(view), version = view.stateVersion
      if (action.type === 'CLAIM_ROUTE') {
        const button = current.locator(`[data-route-id="${action.routeId}"]`)
        if (!await button.isVisible()) await current.getByText('Find a route · accessible list of all 100 tracks',{exact:true}).click()
        await button.click(); await current.getByRole('button',{name:'Confirm claim',exact:true}).click(); claims++
      } else if (action.type === 'DRAW_TRAIN_CARD') {
        if (action.source === 'blind') await current.getByRole('button',{name:'Draw blind',exact:false}).click()
        else await current.getByRole('button',{name:`Take market ${action.source+1}: ${view.public.faceUp[action.source]}`,exact:true}).click()
      } else if (action.type === 'DRAW_DESTINATION_TICKETS') await current.getByRole('button',{name:/Draw destination tickets/}).click()
      else if (action.type === 'KEEP_DESTINATION_TICKETS') await current.getByRole('button',{name:`Keep ${action.ticketIds.length} ticket${action.ticketIds.length===1?'':'s'}`,exact:true}).click()
      await expect.poll(() => views.get(current)?.stateVersion).toBeGreaterThan(version)
      if (!rejoined && views.get(current)?.public.turn.drawsTaken === 1) {
        const hand = views.get(current)!.private.hand
        await current.reload(); await expect.poll(() => views.get(current)?.stateVersion).toBeGreaterThan(version+1)
        expect(views.get(current)!.public.turn.drawsTaken).toBe(1); expect(views.get(current)!.private.hand).toEqual(hand); rejoined = true
      }
      if (claims === 1 && action.type === 'CLAIM_ROUTE') await page.screenshot({path:'test-results/railway-first-trains.png',fullPage:true})
    }
    expect(actions).toBeLessThan(600); expect(rejoined).toBe(true); expect(claims).toBeGreaterThan(10)
    await expect(page.getByRole('heading',{name:/wins|share the victory/})).toBeVisible()
    await expect(guest.getByRole('heading',{name:/wins|share the victory/})).toBeVisible()
    expect(views.get(page)!.public.results).toEqual(views.get(guest)!.public.results)
    await page.screenshot({path:'test-results/railway-final-results.png',fullPage:true})
    const takeover = await secondBrowser.newPage(); await takeover.goto(page.url()); await takeover.getByLabel('Your nickname').fill('Alice'); await takeover.getByRole('button',{name:'Join table',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Seat opened elsewhere',exact:true})).toBeVisible()
    expect(errors).toEqual([])
  } finally { await secondBrowser.close() }
})

test('mobile landing, validation, original page ordering and deep-link refresh', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/games/trains')
  await expect(page.getByRole('heading',{name:'Railway Tabletop',exact:true})).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto('/games/trains/INVALID'); await expect(page.getByRole('heading',{name:'That room code is not valid.'})).toBeVisible(); await page.reload(); await expect(page.getByText('Return to the station')).toBeVisible()
  await page.goto('/games'); await expect(page.locator('h2').first()).toHaveText('Board Game Menu'); await expect(page.getByText('Sonora Whiteboard')).toHaveCount(0); await expect(page.getByText('Splendid Rivalry')).toHaveCount(0)
})

for (const count of [3,5]) test(`${count}-player lobby, private initial selections, live turns and mobile board`, async ({browser,page}) => {
  const guests = await Promise.all(Array.from({length:count-1},() => browser.newContext({viewport:{width:1200,height:900}})))
  try {
    await page.goto('/games/trains'); await page.getByLabel('Your nickname').fill('Host'); await page.getByRole('button',{name:'Create a table',exact:true}).click()
    await expect(page.getByRole('heading',{name:'The departure lounge'})).toBeVisible()
    const participants=[page]
    for (const [i,context] of guests.entries()) { const target=await context.newPage(); participants.push(target); await target.goto(page.url()); await target.getByLabel('Your nickname').fill(`Guest ${i}`); await target.getByRole('button',{name:'Join table',exact:true}).click(); await expect(page.getByText(`Guest ${i}`,{exact:true})).toBeVisible() }
    await page.getByRole('button',{name:'Start journey',exact:true}).click()
    for (const target of participants) {await expect(target.getByRole('heading',{name:'Which journeys will you take?'})).toBeVisible(); await target.getByRole('button',{name:'Keep 3 tickets',exact:true}).click()}
    for (const target of participants) await expect(target.locator('.rail-turn-banner h2')).toContainText(/Your turn|turn/)
    const active = (await Promise.all(participants.map(async target => ({target,text:await target.locator('.rail-turn-banner h2').textContent()})))).find(v => v.text?.includes('Your turn'))!.target
    await active.getByRole('button',{name:/Draw blind/}).click(); await expect(active.locator('.rail-turn-banner')).toContainText('One card drawn')
    await active.getByRole('button',{name:/Draw blind/}).click()
    await page.setViewportSize({width:390,height:844}); await expect(page.locator('.rail-board-canvas canvas')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button',{name:'Text route list',exact:true}).click(); await expect(page.locator('[data-route-id]')).toHaveCount(100)
    await page.locator('[data-route-id]').first().click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.screenshot({path:`test-results/railway-${count}-player-mobile.png`,fullPage:true})
  } finally { await Promise.all(guests.map(context => context.close())) }
})

test('all 100 physical tracks can be selected on the actual 3D canvas', async ({browser,page}) => {
  const context=await browser.newContext(), guest=await context.newPage()
  try {
    await page.goto('/games/trains'); await page.getByLabel('Your nickname').fill('Map Tester'); await page.getByRole('button',{name:'Create a table',exact:true}).click()
    await expect(page.getByRole('heading',{name:'The departure lounge'})).toBeVisible()
    await guest.goto(page.url()); await guest.getByLabel('Your nickname').fill('Other Traveler'); await guest.getByRole('button',{name:'Join table',exact:true}).click()
    await expect(page.getByText('Other Traveler',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Start journey',exact:true}).click()
    await expect(page.locator('.rail-city-label')).toHaveCount(36)
    const canvas=page.locator('.rail-board-canvas canvas'), failures:string[]=[]
    for (const route of ROUTES) {
      let found=false
      for (const slot of trackSlots(route)) {
        await canvas.scrollIntoViewIfNeeded(); const box=(await canvas.boundingBox())!
        const camera = new OrthographicCamera(-box.width/2, box.width/2, box.height/2, -box.height/2, .1, 80)
        camera.position.set(...CAMERA_OFFSET); camera.zoom = boardCameraFraming(box.width,box.height).fitZoom; camera.lookAt(0,0,0); camera.updateProjectionMatrix(); camera.updateMatrixWorld()
        const point = new Vector3(slot.x,.1,slot.z).project(camera)
        await page.mouse.click(box.x+(point.x+1)*box.width/2,box.y+(1-point.y)*box.height/2)
        const dialog=page.getByRole('dialog')
        if (await dialog.isVisible()) { found=await dialog.getByRole('heading',{name:`${CITY_BY_ID[route.cityA].name} → ${CITY_BY_ID[route.cityB].name}`,exact:true}).isVisible(); await page.keyboard.press('Escape') }
        if (found) break
      }
      if (!found) failures.push(route.id)
    }
    expect(failures,'Tracks obscured or not selectable at any segment').toEqual([])
    // Wheel zoom must stop at 60% of the previous maximum visible extent.
    async function landmarks() {
      const west = (await page.locator('.rail-city-label').getByText('San Francisco',{exact:true}).boundingBox())!
      const east = (await page.locator('.rail-city-label').getByText('Miami',{exact:true}).boundingBox())!
      return [{ x:west.x+west.width/2, y:west.y+west.height/2 },{ x:east.x+east.width/2, y:east.y+east.height/2 }]
    }
    const separation = async () => { const [a,b]=await landmarks(); return Math.hypot(a.x-b.x,a.y-b.y) }
    const fittedSeparation = await separation()
    await canvas.scrollIntoViewIfNeeded(); const bounds=(await canvas.boundingBox())!
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2)
    for (let i=0;i<40;i++) await page.mouse.wheel(0,120)
    const frame = boardCameraFraming(bounds.width,bounds.height), expectedRatio=Math.min(10/0.6,frame.fitZoom)/frame.fitZoom
    await expect.poll(async () => await separation()/fittedSeparation).toBeCloseTo(expectedRatio,2)
    const limitedLandmarks=await landmarks()
    for (let i=0;i<10;i++) await page.mouse.wheel(0,120)
    await expect.poll(async () => await separation()/fittedSeparation).toBeCloseTo(expectedRatio,2)
    // A saved pre-update camera keeps its pan, adopts the new angle and is
    // clamped to the new zoom limit when the room reloads.
    await page.evaluate(() => {
      const key=Object.keys(sessionStorage).find(key=>key.startsWith('trains.camera.'))!
      sessionStorage.setItem(key,JSON.stringify({ position:[0,24,6],target:[0,0,0],zoom:10 }))
    })
    await page.reload(); await expect(page.locator('.rail-city-label')).toHaveCount(36)
    await canvas.scrollIntoViewIfNeeded()
    await expect.poll(async () => await separation()/fittedSeparation).toBeCloseTo(expectedRatio,2)
    const restoredLandmarks=await landmarks()
    for (let i=0;i<2;i++) expect(restoredLandmarks[i].x).toBeCloseTo(limitedLandmarks[i].x,0)
    await page.getByRole('button',{name:'Reset view',exact:true}).click()
    await expect.poll(separation).toBeCloseTo(fittedSeparation,0)
    await page.locator('.rail-board-wrap').screenshot({path:'test-results/railway-camera.png'})
    await page.screenshot({path:'test-results/railway-board.png',fullPage:true})
  } finally {await context.close()}
})
