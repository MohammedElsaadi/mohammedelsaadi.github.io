import { CanvasTexture, SRGBColorSpace } from 'three'

/** Entire map artwork is procedural. No publisher scans, fonts or textures. */
export function parchmentTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1500
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e6d7b2'; ctx.fillRect(0, 0, 2400, 1500)
  // A deliberately simplified, original continental silhouette.
  const coastline = [[.08,.07],[.5,.04],[.83,.07],[.92,.13],[.96,.22],[.93,.32],[.96,.44],[.92,.5],[.9,.64],[.88,.69],[.93,.86],[.91,.94],[.87,.88],[.85,.76],[.79,.72],[.72,.78],[.66,.84],[.6,.86],[.53,.89],[.47,.8],[.38,.8],[.33,.77],[.25,.81],[.19,.72],[.13,.67],[.08,.55],[.06,.44],[.06,.33],[.08,.23]]
  ctx.beginPath(); coastline.forEach(([x,y], i) => { if (i) ctx.lineTo(x * 2400,y * 1500); else ctx.moveTo(x * 2400,y * 1500) }); ctx.closePath(); ctx.fillStyle = '#f1e5c5'; ctx.fill(); ctx.strokeStyle = '#a19576'; ctx.lineWidth = 3; ctx.stroke()
  ctx.strokeStyle = '#ab9b7530'; ctx.lineWidth = 1
  for (let x = 0; x < 2400; x += 120) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,1500); ctx.stroke() }
  for (let y = 0; y < 1500; y += 100) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(2400,y); ctx.stroke() }
  // Engraved mountain marks: fixed arithmetic keeps the artwork reproducible.
  ctx.strokeStyle = '#a5956d45'; ctx.lineWidth = 2
  for (let i = 0; i < 100; i++) {
    const x = 450 + Math.sin(i * 3.7) * 130 + i * 1.7, y = 190 + i * 9
    ctx.beginPath(); ctx.moveTo(x-10,y+10); ctx.lineTo(x,y-13); ctx.lineTo(x+14,y+10); ctx.stroke()
  }
  ctx.fillStyle = '#52634b55'; ctx.font = 'italic 30px Georgia'; ctx.fillText('THE GREAT PLAINS', 900, 680)
  ctx.save(); ctx.translate(260,820); ctx.rotate(-0.7); ctx.fillText('P A C I F I C', 0,0); ctx.restore()
  ctx.fillText('A T L A N T I C', 1950,990)
  ctx.fillStyle = '#70502c'; ctx.textAlign = 'center'; ctx.font = 'bold 36px Georgia'; ctx.fillText('THE NORTH AMERICAN RAILWAY', 1200, 1440)
  // Grain/vignette use a stable PRNG instead of random values during React render.
  let seed = 42
  for (let i = 0; i < 45000; i++) { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; const x = seed % 2400; seed = (Math.imul(seed,1664525)+1013904223) >>> 0; ctx.fillStyle = i % 2 ? '#74562b0b' : '#fff7dd14'; ctx.fillRect(x,seed%1500,2,2) }
  const gradient = ctx.createRadialGradient(1200,750,350,1200,750,1400); gradient.addColorStop(0,'#39271400'); gradient.addColorStop(1,'#39271455'); ctx.fillStyle=gradient; ctx.fillRect(0,0,2400,1500)
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4
  return texture
}
