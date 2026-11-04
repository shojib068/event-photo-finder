# Screen Specification: Wedding Face-Search Photo Web App

**Based on:** Functional Specification v2.1 (multiple Drive links)

## Screen Map

| # | Screen | Used by | Route (suggested) |
|---|---|---|---|
| A1 | Admin Page | Admin | `/admin` |
| G0 | Not Available | Guest | `/g/{linkId}` (state) |
| G1 | Welcome | Guest | `/g/{linkId}` |
| G2 | Selfie | Guest | `/g/{linkId}` (step) |
| G3 | Searching | Guest | `/g/{linkId}` (step) |
| G4 | Match (Gallery) | Guest | `/p/{longRandomToken}` |
| G5 | No Match | Guest | `/g/{linkId}` (step) |

Guest flow:

```
Scan QR -> [Link Ready + Active?]
              |-- No  -> G0 Not Available
              |-- Yes -> G1 Welcome -> G2 Selfie -> G3 Searching
                                                     |-- Match    -> G4 Gallery (private link)
                                                     |-- No match -> G5 No Match -> (Try again) -> G2
```

---

## A1. Admin Page

**Purpose:** The single admin page. Add Drive folder links, watch indexing, get QR codes, and switch links on or off.

**Constraints:** No login, no analytics, no settings pages. One page only.

### Layout

1. **Header area**
   - App name.
   - **Service email box:** shows the app's email address with a **Copy** button.
   - Helper text: "Share each Drive folder with this email before adding its link."
2. **Add link section**
   - Text field: "Paste Google Drive folder link".
   - **Add** button.
3. **Links list**
   - One row (card) per added link, newest first.

### Link row contents

| Element | Behaviour |
|---|---|
| Folder name | Read from Drive after the link is added |
| Status badge | `Queued` -> `Indexing...` -> `Ready` |
| Photo / progress info (optional) | Shown while indexing (for example "120 / 400 photos") |
| QR code | Shown only when status is `Ready` |
| **Download QR** button | Downloads the QR code as an image (PNG); visible only when QR is shown |
| **Active** switch | On/off toggle; disabled until status is `Ready` |

### Functionality

- **Add link**
  - The admin pastes a Drive folder link and presses Add.
  - The app checks that the link looks like a valid Drive folder link.
  - The app checks that it can access the folder (shared with the service email).
  - On success, a new row appears with status `Queued`.
  - More links can be added at any time, including while others are indexing.
- **Indexing**
  - Links are processed one after another (queue). The row moves from `Queued` to `Indexing...` to `Ready`.
  - The page updates statuses automatically (polling or live updates). No manual refresh needed.
- **QR code**
  - Created once indexing finishes.
  - Each link has its own QR code that points to its guest page.
  - The QR code works only while the link is `Ready` and Active is on.
- **Active switch**
  - Disabled (greyed out) until status is `Ready`.
  - On: guests who scan the QR code see the Welcome screen.
  - Off: guests who scan the QR code see the Not Available screen.
  - Switching off does **not** disable gallery links already given to guests.
  - The switch state is saved immediately.

### Error and edge states

| Situation | What the admin sees |
|---|---|
| Invalid link format | Inline message: "This does not look like a Google Drive folder link." |
| Folder not shared with the app | Inline message: "We cannot open this folder. Share it with the email shown above, then try again." |
| Link already added | Inline message: "This folder has already been added." |
| Indexing fails | Row status shows an error state with a **Retry** button |
| Folder has no photos | Row shows "No photos found" and cannot be switched on |

### Not included

No login, no analytics, no settings, no delete of gallery links, no guest data.

---

## G0. Not Available (Guest)

**Purpose:** Tell the guest the photos cannot be searched right now.

**Shown when:**
- The link is not `Ready` (still queued or indexing), or
- The Active switch is off, or
- The link code in the URL does not exist.

**Content:**
- Short message: "These photos are not available right now." (final text to be provided)
- Optional: "Please try again later."

**Functionality:**
- No buttons that start the search; the camera is never opened.
- Reloading the page re-checks the link state, so if the admin switches the link on, the guest sees Welcome after a refresh.

---

## G1. Welcome (Guest)

**Purpose:** Greet the guest and let them start.

**Content:**
- Welcome message (text to be provided later).
- Short privacy note: "Your selfie is used only to find your photos and is not saved."
- **Start** button.

**Functionality:**
- Opens when the guest scans a QR code whose link is `Ready` and Active.
- Pressing **Start** goes to the Selfie screen and asks for camera permission.
- Must work in the phone browser (Android and iOS) without an app install.
- Mobile-first layout (single column, large tap targets).

---

## G2. Selfie (Guest)

**Purpose:** Capture a clear face photo of the guest.

**Content:**
- Live **front camera** preview.
- **Face guide** (oval overlay) showing where to place the face.
- Short tip: "Face the camera in good light."
- **Capture** button.
- After capture: preview of the photo with **Retake** and **Use this photo** buttons.

**Functionality:**
- Requires HTTPS for camera access.
- Front camera is used by default.
- **Retake** returns to the live preview.
- **Use this photo** sends the selfie to the app for matching and goes to Searching.
- The selfie is held in memory only for matching and is not saved.

**Error and edge states:**

| Situation | What the guest sees |
|---|---|
| Camera permission denied | Message explaining how to allow camera access in the browser, with a **Try again** button |
| No camera found or unsupported browser | Message that the camera cannot be used on this device |
| No face detected in the selfie | Message: "We could not see a face. Please retake your selfie." with **Retake** |
| More than one face detected | Message asking for a selfie with only one face, with **Retake** (suggested rule) |

---

## G3. Searching (Guest)

**Purpose:** Show progress while the app looks for matching photos.

**Content:**
- Short loading message (for example "Looking for your photos...") with a loading animation.
- Text to be finalised with the other messages.

**Functionality:**
- The selfie is converted to a face embedding and compared (face model with vector index) against the photos of **only the link that was scanned**.
- Matching uses a fixed threshold of about 90%.
- No user action is needed. When finished:
  - Matches found: go to Match screen and create the private gallery link.
  - No matches: go to No Match screen.
- If the search fails or times out: show "Something went wrong" with a **Try again** button.
- Back button or reload does not resend the selfie.

---

## G4. Match / Gallery (Guest)

**Purpose:** Show the guest their photos and let them download or share them.

**Access:**
- Opened automatically after a match, on a **private link** (long, random, non-guessable).
- The link does not expire, so the guest can bookmark it or reopen it later.
- Anyone with the link can view the gallery.
- Switching the QR link off does not affect this page.

**Content:**
- Heading, for example "We found your photos" with the photo count.
- **Photo grid** (thumbnails).
- **Save all to Photos** button on phones that support sharing files, with a smaller **Download ZIP** link below it. **Download all (ZIP)** button on other devices.
- **Share** button (shares the private gallery link).
- Tip to save or bookmark the page.

**Functionality:**
- **Tap a photo** to open the full-size viewer:
  - Swipe or arrow buttons to move between photos.
  - **Download** (single photo) button.
  - **Close** button to return to the grid.
- **Save all to Photos (phones):** the app gets the photos in groups of 20 and shows progress ("Getting photos... 5 of 20"). When a group is ready, the guest taps **Save 20 photos** and the phone's share sheet opens, where they choose "Save Images". Then they tap for the next group. If the phone cannot share these files, show a message and point to the ZIP link.
- **Download all (ZIP):** a normal browser download of a ZIP with all matched photos. The browser shows the progress.
- **Share:** uses the phone's native share sheet where available. Otherwise it copies the link and shows "Link copied".
- Photos are served through the app. The Drive folder is never made public and Drive links are never shown to the guest.
- Thumbnails load lazily for speed on mobile.

---

## G5. No Match (Guest)

**Purpose:** Tell the guest nothing was found and let them try again.

**Content:**
- Message: "Sorry, we could not find your photos."
- **Try again** button.

**Functionality:**
- **Try again** returns to the Selfie screen (G2) with a fresh camera preview.
- The guest can try as many times as they like.
- No photos or Drive information are shown.

---

## Cross-Screen Rules

- The selfie is used only for matching and is not saved.
- A selfie is matched only against the photos of the link whose QR code was scanned.
- Matching threshold is fixed at about 90% and is not shown or editable.
- Photos are always served through the app, and the Drive folder is never made public.
- HTTPS is required for the camera. Locally this means a secure tunnel such as Cloudflare Tunnel or ngrok.
- Guest screens work on Android and iOS phone browsers with no install.
- Guest message texts (Welcome, Sorry, Not Available) are placeholders until provided.

## Open Items

- Final text for Welcome, Sorry, and Not Available messages.
- Suggested additions that are not in the original spec, to confirm: single-face rule on the selfie, retry button for failed indexing, "No photos found" state, and share sheet fallback.