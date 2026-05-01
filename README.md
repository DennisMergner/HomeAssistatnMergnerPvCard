# Mergner PV Card

Custom Home Assistant Lovelace card for PV energy flow visualization with dynamic nodes, links and a visual editor.

## Features

- Custom card type: `custom:mergner-pv-card`
- Dynamic nodes with free x/y positioning (in percent)
- Multiple PV, battery and custom devices via UI editor
- Up to three live metrics per node (for example power, SOC, daily yield)
- Role based summary chips for generation, load, battery and grid
- Circular device nodes with image inside the device bubble
- Per-node image via URL or direct upload in the card editor
- Adjustable circle size per device node
- Readable in-circle labels with dark translucent background
- Cleaner editor layout with grouped sections and select fields for entities
- Draggable layout preview inside the editor for direct device positioning
- Recommended entity groups for power, energy and battery percentage fields
- Search input above each entity dropdown for fast sensor lookup
- Flow lines can show label and live entity value, each configurable top or bottom
- Dynamic links between nodes with animated direction (forward/reverse)
- Optional own image per node
- Visual Home Assistant card editor (UI based, no YAML required for normal usage)
- HACS compatible repository structure

## Installation via HACS (Custom Repository)

1. Open HACS in Home Assistant.
2. Open menu -> Custom repositories.
3. Add your repository URL.
4. Select repository type: Dashboard.
5. Install Mergner PV Card.
6. Restart Home Assistant.

If resource is not added automatically, add this manual resource:

- URL: `/hacsfiles/HomeAssistatnMergnerPvCard/mergner-pv-card.js`
- Type: `module`

## UI Editor Usage (No YAML Workflow)

1. Open a dashboard.
2. Click Edit dashboard.
3. Add card.
4. Search/select Mergner PV Card.
5. Configure everything in the card editor:
   - Title
  - Layout preview with drag and drop for X/Y positioning
  - Nodes (id, name, type, image, size, x, y)
  - Device image either via URL or direct upload
  - Entity selection via dropdowns with recommended matches first
  - Live search in each entity dropdown
  - Primary value per device, for example current power
  - Secondary and tertiary values, for example SOC and daily energy
  - Links (from, to, optional flow entity, optional label, optional value entity, top/bottom position for both)

Result: You can maintain this card through Home Assistant UI without manual YAML edits.

## Optional YAML Example

YAML is still supported when desired:

```yaml
type: custom:mergner-pv-card
title: PV Anlage
nodes:
  - id: solar
    name: Solar
    role: pv
    entity: sensor.pv_power
    entityLabel: Power
    secondaryEntity: sensor.pv_today
    secondaryLabel: Today
    image: /local/pv/solar.png
    x: 20
    y: 20
  - id: battery
    name: Battery
    role: battery
    entity: sensor.battery_power
    entityLabel: Charge / Discharge
    secondaryEntity: sensor.battery_soc
    secondaryLabel: SOC
    secondaryUnit: "%"
    tertiaryEntity: sensor.battery_today
    tertiaryLabel: Today
    image: /local/pv/battery.png
    x: 80
    y: 20
  - id: house
    name: House
    role: house
    entity: sensor.home_power
    entityLabel: Load
    secondaryEntity: sensor.home_energy_today
    secondaryLabel: Today
    image: /local/pv/house.png
    x: 20
    y: 80
  - id: grid
    name: Grid
    role: grid
    entity: sensor.grid_power
    entityLabel: Import / Export
    image: /local/pv/grid.png
    x: 80
    y: 80
links:
  - from: solar
    to: house
    entity: sensor.pv_to_house_power
  - from: grid
    to: house
    entity: sensor.grid_to_house_power
```

## Development

```bash
npm install
npm run build
npm run build:watch
npm run dev:serve
```

Source: `src/mergner-pv-card.ts`  
Build output: `mergner-pv-card.js`

## Fast Design Preview With Remote HA (RPi)

When Home Assistant runs on another machine, you still can get near-live preview:

1. Start local dev server on your development PC:

```bash
npm run dev:serve
```

2. In Home Assistant Lovelace resources (temporary for design phase), set:

- URL: `http://<DEIN-PC-IP>:4173/mergner-pv-card.js`
- Type: `module`

3. Keep dashboard open, edit code, then hard reload browser (Ctrl+F5).

Result: You see design updates immediately, even with HA on RPi.

Production mode stays GitHub/HACS based.

## Release Automation

The following scripts create a version bump, build, commit, tag and push.

```bash
npm run release:patch
npm run release:minor
npm run release:major
npm run release:prerelease
```

Local dry run style without push:

```bash
npm run release:patch:local
```

Local test mode for development worktrees:

```bash
npm run release:patch:test
```

Non-destructive process check (prints commands only):

```bash
npm run release:dry-run
```

Release script behavior:

1. Requires clean git working tree.
2. Requires branch `main` (default safety check).
3. Runs `npm version ... --no-git-tag-version`.
4. Runs build.
5. Creates commit `chore(release): vX.Y.Z`.
6. Creates git tag `vX.Y.Z`.
7. Pushes branch + tag (except local no-push variant).

## Home Assistant Test Plan (2 Quick Tests)

### Test 1: UI Editor Persistence

1. Add card via dashboard UI.
2. Add one new node and one link in the editor.
3. Save dashboard.
4. Reload browser.

Expected:

- Node and link still exist.
- Card renders without console errors.

### Test 2: Flow Direction Behavior

1. Configure one link with a numeric sensor in `entity` (example power sensor).
2. Force/use positive sensor value.
3. Observe line animation direction.
4. Force/use negative sensor value.
5. Observe reversed line animation direction.

Expected:

- Positive value: forward animation.
- Negative value: reversed animation.
- Zero/non-numeric: idle line.
