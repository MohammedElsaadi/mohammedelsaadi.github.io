"""Regenerate topology facts from the approved spec; no publisher artwork is imported."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
blocks = re.findall(r'```csv\n(.*?)\n```', (root / 'TICKET_TO_RIDE_CODEX_SPEC.md').read_text(encoding='utf-8'), re.S)
def slug(name):
    return name.lower().replace('.', '').replace(' ', '-')
cities = [dict(id=slug(n), name=n, x=float(x), y=float(y)) for n, x, y in (line.split(',') for line in blocks[0].splitlines()[1:])]
raw_routes = [line.split(',') for line in blocks[1].splitlines()[1:]]
routes = []
for rid, a, b, length, color in raw_routes:
    group = '__'.join(sorted([slug(a), slug(b)]))
    parallel = sum({slug(row[1]), slug(row[2])} == {slug(a), slug(b)} for row in raw_routes) > 1
    routes.append(dict(id=rid, cityA=slug(a), cityB=slug(b), length=int(length), color=color, parallelGroupId=group if parallel else None, variant=int(rid.rsplit('__', 1)[1]) - 1))
tickets = [dict(id=f'{slug(a)}__{slug(b)}', cityA=slug(a), cityB=slug(b), points=int(p)) for a, b, p in (line.split(',') for line in blocks[2].splitlines()[1:])]
text = '// Facts transcribed from approved spec Appendices A-C. See docs/trains.md for provenance.\nimport type { City, Route, Ticket } from "./types"\n\n'
for name, kind, values in [('CITIES', 'City', cities), ('ROUTES', 'Route', routes), ('TICKETS', 'Ticket', tickets)]:
    text += f'export const {name}: {kind}[] = ' + json.dumps(values, indent=2) + '\n\n'
text += 'export const CITY_BY_ID = Object.fromEntries(CITIES.map(city => [city.id, city]))\nexport const ROUTE_BY_ID = Object.fromEntries(ROUTES.map(route => [route.id, route]))\nexport const TICKET_BY_ID = Object.fromEntries(TICKETS.map(ticket => [ticket.id, ticket]))\n'
(root / 'shared/trains/board-data.ts').write_text(text, encoding='utf-8')
print(f'Imported {len(cities)} cities, {len(routes)} tracks, {len(tickets)} tickets.')
