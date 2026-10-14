# Trading Journal

Trading Journal is a local-first trading journal PWA. It stores records in versioned JSON in the current browser's `localStorage`; optionally, a user can connect a private Google spreadsheet for multi-device sync. GitHub Pages serves only the static app shell. There is no custom server, broker connection, price feed or tracking.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.
4. Run `npm run typecheck`, `npm test`, and `npm run build` to verify the project.

## Deploy free with GitHub Pages

1. Create a **public** GitHub repository and push this project to its `main` branch.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
3. The included workflow builds the static app and deploys `dist` on every push to `main`; it can also be started from the Actions tab.
4. Wait for the “Deploy Trading Journal” workflow to finish. GitHub shows the published URL in Settings → Pages. Repository sites use `/<repository-name>/`; user/organization sites use the root path.

To install, open the published page online once. On Android use the browser's Install app / Add to Home screen option. On iPhone/iPad in Safari use Share → Add to Home Screen. Browser support for install prompts varies. The cached application shell is available offline after the first online visit; existing records remain in that browser's local storage.

## Records, backups and privacy

- Add/edit/delete trades, strategy labels and daily reviews in the app. Open trades are excluded from realized performance. Break-even closed trades count in the win-rate denominator. Net P&L uses the generic price-difference formula less fees, unless a manual broker-reported net P&L is supplied. Expectancy is mean net P&L per closed trade. Profit factor is gross positive net results divided by absolute gross negative net results. These are journal calculations, not broker statements.
- Export a JSON backup in Settings & Backup. Import validates the file and lets you replace all or merge by stable IDs. Export/import trades as CSV; CSV import expects `date`, `symbol`, `direction`, and `entry` columns and recognizes other Trading Journal export columns. Duplicate IDs are skipped.
- To transfer, download the JSON backup, move it yourself, and import it on the other device. No automatic synchronization occurs.
- Browser/site data clearing, profile deletion, or device loss can erase records. Back up regularly. This is a personal journal, not secure cloud storage. Do not include sensitive data you cannot afford to lose.

## Google sign-in and Google Sheets sync

The app opens with a Google sign-in gate. After you sign in, it syncs records to a private Google spreadsheet directly from the browser using Google Identity Services and the Sheets API. The blank Apps Script project in your screenshot is not required. The app keeps the OAuth access token in memory and does not save it in local storage. After a full page reload, the journal stays open. Trading Journal restores the local account and attempts a silent Google reconnection; if Google needs user interaction, select **Connect & sync** in Settings. Connected edits sync in the background; use **Connect & sync / Sync now** on each device to pull updates. Conflicting edits to the same trade resolve to the newest saved trade. Keep the spreadsheet private and use an account you trust.

1. In Google Cloud Console create a project and enable **Google Sheets API** and **Google Drive API** (the app uses Drive only for a private app-settings file).
2. Configure the Google Auth Platform consent screen for your own Google account. If the app is in Testing mode, add your Google account as a test user.
3. Create an OAuth client ID with application type **Web application**. Add `http://localhost:5173` as an authorized JavaScript origin. Once deployed, add the site's origin as well (for example `https://yourname.github.io`; origins do not include the repository path).
4. Do not create a spreadsheet manually. After sign-in, Trading Journal creates a private Trading Journal spreadsheet in the selected Google account and stores its ID in that app's hidden Drive app-data folder so your other devices can find the same sheet.
5. Select **Continue with Google** and approve the Google request. The client ID is preconfigured in the app; no manual ID entry is needed. Repeat on the other device using the same Google account and OAuth client ID; Trading Journal finds that account's existing journal automatically. Each Google email gets a separate local browser data namespace.

The authorization requests verified email/profile, permission to create and access files made by this app (drive.file), and permission for this app's own hidden configuration data (drive.appdata). It does not request Gmail or general Drive access. The client ID is not a password; do not share an OAuth client secret or access token. The app stores its rows in a `TradeWiseData` tab for compatibility with existing journals. Both devices need an internet connection to sync. Google API quotas and terms can change; standard Sheets API use is currently free, but avoid automated high-frequency polling. Keep JSON backups as a second recovery path.

## Scope notes

The trade form focuses on date, instrument, direction, status, entry/exit, stop/target, quantity, setup, emotion, notes and a Yes/No rule-following answer. Closed trades need an exit price for automatic result calculation. Fees and the per-trade multiplier are hidden; new trades use a generic multiplier of 1, so results may differ from broker-reported P&L for lots, CFDs, futures or instruments requiring currency conversion. Account setup includes name, broker, account type, currency, starting balance and start date.

The app includes dashboard and account/date filters, trade CRUD, a monthly calendar, setup analytics, daily reviews, a risk sizing calculator, JSON backup/restore, CSV import/export and Google Sheets sync. Connected clients check for remote changes about every 30 seconds while the app is open and visible. Edits to the same trade resolve to the latest saved version; keep JSON backups as a recovery path. The app does not include broker connections, live prices, screenshot attachments, account currency conversion, calendar week/day drill-down or detailed CSV column mapping.
