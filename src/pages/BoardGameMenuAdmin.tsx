import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { boardGameApi } from '../features/board-game-menu/api/boardGameApi'
import type { AdminCatalogResponse, CatalogContainer, CatalogGame, GameStatus, SavedMenu, Tag } from '../features/board-game-menu/api/types'
import { menuTitle } from '../features/board-game-menu/utils/dates'
import '../features/board-game-menu/board-game-menu.css'

type AdminTab = 'games' | 'containers' | 'tags' | 'menus'

const blankGame = (containerId = '') => ({
  name: '', slug: '', itemType: 'game', status: 'draft', containerId, selectable: true,
  alwaysPacked: false, allowOverflow: true, widthMm: '', heightMm: '', depthMm: '', weightGrams: '',
  minPlayers: '', maxPlayers: '', minPlayTimeMinutes: '', maxPlayTimeMinutes: '', complexity: '',
  course: '', sortOrder: '0', tagIds: [] as string[],
})

type GameForm = ReturnType<typeof blankGame>

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function numberOrNull(value: string | number | null) {
  if (value === '' || value === null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function gameToForm(game: CatalogGame): GameForm {
  return {
    name: game.name,
    slug: game.slug,
    itemType: game.itemType,
    status: game.status,
    containerId: game.containerId,
    selectable: game.selectable,
    alwaysPacked: game.alwaysPacked,
    allowOverflow: game.allowOverflow,
    widthMm: game.widthMm?.toString() ?? '',
    heightMm: game.heightMm?.toString() ?? '',
    depthMm: game.depthMm?.toString() ?? '',
    weightGrams: game.weightGrams?.toString() ?? '',
    minPlayers: game.minPlayers?.toString() ?? '',
    maxPlayers: game.maxPlayers?.toString() ?? '',
    minPlayTimeMinutes: game.minPlayTimeMinutes?.toString() ?? '',
    maxPlayTimeMinutes: game.maxPlayTimeMinutes?.toString() ?? '',
    complexity: game.complexity?.toString() ?? '',
    course: game.course ?? '',
    sortOrder: game.sortOrder.toString(),
    tagIds: game.tags.map((tag) => tag.id),
  }
}

function formPayload(form: GameForm, status = form.status) {
  return {
    ...form,
    status,
    widthMm: numberOrNull(form.widthMm),
    heightMm: numberOrNull(form.heightMm),
    depthMm: numberOrNull(form.depthMm),
    weightGrams: numberOrNull(form.weightGrams),
    minPlayers: numberOrNull(form.minPlayers),
    maxPlayers: numberOrNull(form.maxPlayers),
    minPlayTimeMinutes: numberOrNull(form.minPlayTimeMinutes),
    maxPlayTimeMinutes: numberOrNull(form.maxPlayTimeMinutes),
    complexity: numberOrNull(form.complexity),
    course: form.course || null,
    sortOrder: Number(form.sortOrder) || 0,
  }
}

function BoardGameMenuAdmin() {
  const [tab, setTab] = useState<AdminTab>('games')
  const [catalog, setCatalog] = useState<AdminCatalogResponse | null>(null)
  const [menus, setMenus] = useState<SavedMenu[]>([])
  const [selectedGame, setSelectedGame] = useState<CatalogGame | null | 'new'>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await boardGameApi.admin.getCatalog()
      setCatalog(response)
      setError(null)
    } catch {
      setError('Admin data is unavailable. Run the full local stack or check the Cloudflare Access/session configuration.')
    }
  }, [])

  useEffect(() => {
    let active = true
    boardGameApi.admin.getCatalog().then(
      (response) => {
        if (!active) return
        setCatalog(response)
        setError(null)
      },
      () => {
        if (active) setError('Admin data is unavailable. Run the full local stack or check the Cloudflare Access/session configuration.')
      },
    )
    return () => { active = false }
  }, [])

  const loadMenus = async () => {
    try { setMenus(await boardGameApi.admin.getMenus()) } catch { setError('Could not load saved menus.') }
  }

  useEffect(() => {
    if (tab !== 'menus') return
    let active = true
    boardGameApi.admin.getMenus().then(
      (response) => { if (active) setMenus(response) },
      () => { if (active) setError('Could not load saved menus.') },
    )
    return () => { active = false }
  }, [tab])

  if (!catalog && error) return <main className="bgm-page-state"><strong>{error}</strong><Link to="/games/board-game-menu">Back to picker</Link></main>
  if (!catalog) return <main className="bgm-page-state">Loading Admin…</main>

  return (
    <main className="bgm-admin-page">
      <header className="bgm-admin-hero">
        <div>
          <Link to="/games/board-game-menu" className="bgm-back-link">← Public picker</Link>
          <span className="bgm-kicker">Collection workshop</span>
          <h1>Board Game Menu Admin</h1>
          <p>Maintain the shelf, real dimensions, containers, tags, artwork, and saved menus.</p>
        </div>
        <span className="bgm-access-note">Protect this route and its API with Cloudflare Access</span>
      </header>
      <nav className="bgm-admin-tabs" aria-label="Admin sections">
        {(['games', 'containers', 'tags', 'menus'] as AdminTab[]).map((name) => (
          <button key={name} type="button" aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}>{name}</button>
        ))}
      </nav>
      {message ? <div className="bgm-admin-message" role="status">{message}</div> : null}
      {error ? <div className="bgm-admin-error" role="alert">{error}</div> : null}

      <div className="bgm-admin-content">
        {tab === 'games' ? (
          <section>
            <div className="bgm-admin-section-heading"><div><h2>Games & accessories</h2><p>Draft incomplete entries; activate only when public details are complete.</p></div><button className="bgm-primary-button" type="button" onClick={() => setSelectedGame('new')}>Add Game</button></div>
            {selectedGame ? (
              <GameEditor
                key={selectedGame === 'new' ? 'new' : selectedGame.id}
                game={selectedGame === 'new' ? null : selectedGame}
                containers={catalog.containers}
                tags={catalog.tags}
                onClose={() => setSelectedGame(null)}
                onSaved={async (text) => { setMessage(text); setSelectedGame(null); await load() }}
                onError={setError}
              />
            ) : null}
            <div className="bgm-admin-table-wrap">
              <table className="bgm-admin-table">
                <thead><tr><th>Cover</th><th>Name</th><th>Storage</th><th>Course</th><th>Dimensions</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{catalog.games.map((game) => (
                  <tr key={game.id}>
                    <td>{game.coverUrl ? <img src={game.coverUrl} alt="" /> : <span className="bgm-cover-fallback">◇</span>}</td>
                    <td><strong>{game.name}</strong><small>{game.itemType}</small></td>
                    <td>{catalog.containers.find((container) => container.id === game.containerId)?.name ?? 'Unknown'}</td>
                    <td>{game.course ?? '—'}</td>
                    <td>{game.widthMm && game.heightMm && game.depthMm ? `${game.widthMm} × ${game.heightMm} × ${game.depthMm} mm` : '—'}</td>
                    <td><span className={`bgm-status bgm-status--${game.status}`}>{game.status}</span></td>
                    <td><div className="bgm-table-actions">
                      <button type="button" onClick={() => setSelectedGame(game)}>Edit</button>
                      <button type="button" onClick={async () => { await boardGameApi.admin.saveGame(game.id, formPayload(gameToForm(game), game.status === 'archived' ? 'draft' : 'archived')); setMessage(game.status === 'archived' ? 'Game restored as a draft.' : 'Game archived.'); await load() }}>{game.status === 'archived' ? 'Restore' : 'Archive'}</button>
                      <button type="button" className="is-danger" onClick={async () => { if (!window.confirm(`Permanently delete ${game.name}? Historical references will prevent unsafe deletion.`)) return; try { await boardGameApi.admin.deleteGame(game.id); await load() } catch { setError('This game cannot be deleted while a saved menu references it. Archive it instead.') } }}>Delete</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        ) : null}
        {tab === 'containers' ? <ContainersAdmin containers={catalog.containers} onSaved={async () => { setMessage('Container settings saved.'); await load() }} onError={setError} /> : null}
        {tab === 'tags' ? <TagsAdmin tags={catalog.tags} onSaved={async (text) => { setMessage(text); await load() }} onError={setError} /> : null}
        {tab === 'menus' ? <MenusAdmin menus={menus} catalog={catalog} onSaved={async (text) => { setMessage(text); await loadMenus() }} onError={setError} /> : null}
      </div>
    </main>
  )
}

function GameEditor({ game, containers, tags, onClose, onSaved, onError }: { game: CatalogGame | null; containers: CatalogContainer[]; tags: Tag[]; onClose: () => void; onSaved: (message: string) => void; onError: (message: string) => void }) {
  const [form, setForm] = useState<GameForm>(() => game ? gameToForm(game) : blankGame(containers[0]?.id))
  const [cover, setCover] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof GameForm>(key: K, value: GameForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const needsTwoStepActivation = !game && form.status === 'active' && Boolean(cover)
      const result = await boardGameApi.admin.saveGame(game?.id ?? null, formPayload(form, needsTwoStepActivation ? 'draft' : form.status))
      if (cover) await boardGameApi.admin.uploadCover(result.id, cover)
      if (needsTwoStepActivation) await boardGameApi.admin.saveGame(result.id, formPayload(form, 'active'))
      onSaved(game ? 'Game updated.' : 'Game created.')
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Could not save the game.')
    } finally { setSaving(false) }
  }

  return (
    <form className="bgm-admin-editor" onSubmit={submit}>
      <div className="bgm-admin-row"><h3>{game ? `Edit ${game.name}` : 'Add a game or accessory'}</h3><button type="button" className="bgm-text-button" onClick={onClose}>Close</button></div>
      <div className="bgm-admin-form-grid">
        <AdminField label="Name"><input required value={form.name} onChange={(event) => { update('name', event.target.value); if (!game) update('slug', slugify(event.target.value)) }} /></AdminField>
        <AdminField label="Slug"><input required value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} /></AdminField>
        <AdminField label="Item type"><select value={form.itemType} onChange={(event) => update('itemType', event.target.value as GameForm['itemType'])}><option value="game">Game</option><option value="accessory">Accessory</option></select></AdminField>
        <AdminField label="Status"><select value={form.status} onChange={(event) => update('status', event.target.value as GameStatus)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></AdminField>
        <AdminField label="Container"><select required value={form.containerId} onChange={(event) => update('containerId', event.target.value)}>{containers.map((container) => <option key={container.id} value={container.id}>{container.name}</option>)}</select></AdminField>
        <AdminField label="Course"><select value={form.course} onChange={(event) => update('course', event.target.value as GameForm['course'])}><option value="">None</option><option value="appetizer">Appetizer</option><option value="main">Main Course</option><option value="dessert">Dessert</option></select></AdminField>
        {(['widthMm', 'heightMm', 'depthMm', 'weightGrams'] as const).map((field) => <AdminField key={field} label={field === 'weightGrams' ? 'Weight (grams)' : `${field.replace('Mm','')} (mm)`}><input type="number" min="1" value={form[field]} onChange={(event) => update(field, event.target.value)} /></AdminField>)}
        {form.itemType === 'game' ? <>
          {(['minPlayers', 'maxPlayers', 'minPlayTimeMinutes', 'maxPlayTimeMinutes'] as const).map((field) => <AdminField key={field} label={field.replace(/([A-Z])/g, ' $1')}><input type="number" min="1" value={form[field]} onChange={(event) => update(field, event.target.value)} /></AdminField>)}
          <AdminField label="Complexity (1–5)"><input type="number" min="1" max="5" value={form.complexity} onChange={(event) => update('complexity', event.target.value)} /></AdminField>
        </> : null}
        <AdminField label="Sort order"><input type="number" value={form.sortOrder} onChange={(event) => update('sortOrder', event.target.value)} /></AdminField>
        <AdminField label="Cover image"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCover(event.target.files?.[0] ?? null)} /></AdminField>
      </div>
      <fieldset className="bgm-admin-checks"><legend>Storage behavior</legend>
        <label><input type="checkbox" checked={form.selectable} onChange={(event) => update('selectable', event.target.checked)} /> Selectable</label>
        <label><input type="checkbox" checked={form.alwaysPacked} onChange={(event) => update('alwaysPacked', event.target.checked)} /> Always packed</label>
        <label><input type="checkbox" checked={form.allowOverflow} onChange={(event) => update('allowOverflow', event.target.checked)} /> Allow overflow</label>
      </fieldset>
      {form.itemType === 'game' ? <fieldset className="bgm-admin-checks"><legend>Vibe tags</legend>{tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={() => update('tagIds', form.tagIds.includes(tag.id) ? form.tagIds.filter((id) => id !== tag.id) : [...form.tagIds, tag.id])} /> {tag.name}</label>)}</fieldset> : null}
      <div className="bgm-admin-form-actions">{game?.coverUrl && game.status === 'draft' ? <button type="button" className="bgm-secondary-button" onClick={async () => { await boardGameApi.admin.removeCover(game.id); onSaved('Cover removed.') }}>Remove current cover</button> : null}<button type="button" className="bgm-secondary-button" onClick={onClose}>Cancel</button><button className="bgm-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
    </form>
  )
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="bgm-admin-field"><span>{label}</span>{children}</label> }

function ContainersAdmin({ containers, onSaved, onError }: { containers: CatalogContainer[]; onSaved: () => void; onError: (message: string) => void }) {
  return <section><div className="bgm-admin-section-heading"><div><h2>Containers</h2><p>The Main Crate dimensions drive both packing and the 3D model.</p></div></div><div className="bgm-container-grid">{containers.map((container) => <ContainerEditor key={container.id} container={container} onSaved={onSaved} onError={onError} />)}</div></section>
}

function ContainerEditor({ container, onSaved, onError }: { container: CatalogContainer; onSaved: () => void; onError: (message: string) => void }) {
  const [value, setValue] = useState(container)
  const crate = container.slug === 'main-crate'
  return <form className="bgm-admin-card" onSubmit={async (event) => { event.preventDefault(); try { await boardGameApi.admin.updateContainer(value); onSaved() } catch (error) { onError(error instanceof Error ? error.message : 'Could not save the container.') } }}><span className="bgm-kicker">{container.packingMode}</span><h3>{container.name}</h3><AdminField label="Name"><input value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} /></AdminField>{crate ? <>{(['innerWidthMm','innerHeightMm','innerDepthMm'] as const).map((field) => <AdminField key={field} label={`${field.replace('inner','Internal ').replace('Mm','')} (mm)`}><input type="number" min="1" value={value[field] ?? ''} onChange={(event) => setValue({ ...value, [field]: numberOrNull(event.target.value) })} /></AdminField>)}<AdminField label="Overflow limit"><input type="number" min="0" max="2" value={value.overflowLimit} onChange={(event) => setValue({ ...value, overflowLimit: Number(event.target.value) })} /></AdminField></> : <p>Contents are all active games assigned to this tote. Tote capacity is intentionally out of scope for v1.</p>}<label className="bgm-admin-checkbox"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue({ ...value, isActive: event.target.checked })} /> Active</label><button className="bgm-primary-button">Save container</button></form>
}

function TagsAdmin({ tags, onSaved, onError }: { tags: Tag[]; onSaved: (message: string) => void; onError: (message: string) => void }) {
  const [name, setName] = useState('')
  return <section><div className="bgm-admin-section-heading"><div><h2>Vibe tags</h2><p>These flexible tags appear automatically in the public filter bar.</p></div></div><form className="bgm-tag-create" onSubmit={async (event) => { event.preventDefault(); try { await boardGameApi.admin.createTag(name); setName(''); onSaved('Tag created.') } catch (error) { onError(error instanceof Error ? error.message : 'Could not create tag.') } }}><input required placeholder="New tag name" value={name} onChange={(event) => setName(event.target.value)} /><button className="bgm-primary-button">Add tag</button></form><div className="bgm-tag-list">{tags.map((tag) => <div key={tag.id}><strong>{tag.name}</strong><code>{tag.slug}</code><span><button type="button" onClick={async () => { const next = window.prompt('Rename tag', tag.name); if (!next) return; try { await boardGameApi.admin.updateTag(tag.id, next); onSaved('Tag renamed.') } catch (error) { onError(error instanceof Error ? error.message : 'Could not rename tag.') } }}>Rename</button><button className="is-danger" type="button" onClick={async () => { if (!window.confirm(`Delete the ${tag.name} tag?`)) return; try { await boardGameApi.admin.deleteTag(tag.id); onSaved('Tag deleted.') } catch (error) { onError(error instanceof Error ? error.message : 'Could not delete tag.') } }}>Delete</button></span></div>)}</div></section>
}

function MenusAdmin({ menus, catalog, onSaved, onError }: { menus: SavedMenu[]; catalog: AdminCatalogResponse; onSaved: (message: string) => void; onError: (message: string) => void }) {
  const [editing, setEditing] = useState<SavedMenu | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [toteSelected, setToteSelected] = useState(false)
  const startEdit = (menu: SavedMenu) => { setEditing(menu); setSelected(menu.selectedCrateGameIds); const tote = catalog.containers.find((container) => container.slug === 'board-game-tote'); setToteSelected(Boolean(tote && menu.selectedContainerIds.includes(tote.id))) }
  return <section><div className="bgm-admin-section-heading"><div><h2>Saved menus</h2><p>One Board Game Menu per game-night date.</p></div></div>{editing ? <form className="bgm-admin-editor" onSubmit={async (event) => { event.preventDefault(); const crate = catalog.containers.find((container) => container.slug === 'main-crate'); const tote = catalog.containers.find((container) => container.slug === 'board-game-tote'); try { await boardGameApi.admin.updateMenu(editing.id, { gameNightDate: editing.gameNightDate, selectedCrateGameIds: selected, selectedContainerIds: [...(selected.length && crate ? [crate.id] : []), ...(toteSelected && tote ? [tote.id] : [])] }); setEditing(null); onSaved('Saved menu updated.') } catch (error) { onError(error instanceof Error ? error.message : 'Could not update menu.') } }}><div className="bgm-admin-row"><h3>{menuTitle(editing.gameNightDate)}</h3><button type="button" className="bgm-text-button" onClick={() => setEditing(null)}>Close</button></div><fieldset className="bgm-admin-checks"><legend>Crate games</legend>{catalog.games.filter((game) => game.status === 'active' && game.selectable && game.containerSlug === 'main-crate').map((game) => <label key={game.id}><input type="checkbox" checked={selected.includes(game.id)} onChange={() => setSelected(selected.includes(game.id) ? selected.filter((id) => id !== game.id) : [...selected, game.id])} /> {game.name}</label>)}</fieldset><label className="bgm-admin-checkbox"><input type="checkbox" checked={toteSelected} onChange={(event) => setToteSelected(event.target.checked)} /> Include Board Game Tote</label><button className="bgm-primary-button">Save menu changes</button></form> : null}<div className="bgm-menu-list">{menus.map((menu) => <article key={menu.id}><div><strong>{menu.title}</strong><span>Updated {new Date(menu.updatedAt).toLocaleString()}</span></div><div className="bgm-table-actions"><Link to={`/games/board-game-menu/menu/${menu.id}`}>Open</Link><button type="button" onClick={() => startEdit(menu)}>Edit</button><button type="button" className="is-danger" onClick={async () => { if (!window.confirm(`Delete ${menu.title}?`)) return; try { await boardGameApi.admin.deleteMenu(menu.id); onSaved('Menu deleted.') } catch (error) { onError(error instanceof Error ? error.message : 'Could not delete menu.') } }}>Delete</button></div></article>)}</div>{menus.length === 0 ? <p>No saved menus yet.</p> : null}</section>
}

export default BoardGameMenuAdmin
