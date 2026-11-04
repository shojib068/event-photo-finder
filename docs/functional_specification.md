# Functional Specification
## Multi-Event QR-Based Selfie Photo Finder

**Version:** 2.0  
**Project Type:** Web Application  
**Architecture:** Static Cloud Hosting + Google Drive API + Browser-Based Face Recognition  
**Database:** Not Required  
**Budget:** Free-tier services only

---

## 1. Project Overview

Develop a web application that allows visitors to find their photographs from multiple Google Drive folders using a selfie.

Each Google Drive folder represents a separate event and has its own permanent QR code.

Visitors scan an event-specific QR code, capture a selfie, and receive photographs containing a matching face from that event's Google Drive folder.

The application must remain accessible even when the developer's or administrator's computer is switched off.

### Core Principles

- Multiple permanent QR codes.
- Multiple Google Drive folders.
- One shared website.
- One unique URL per event.
- Separate face indexes for each event.
- No database.
- No admin dashboard.
- No visitor registration.
- No continuously running local server.
- No paid APIs or services.
- Selfie processing should happen locally in the visitor's browser.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Hosting | Cloudflare Pages |
| Face Recognition | Human (TensorFlow.js-based) |
| Image Source | Google Drive API |
| QR Generation | qrcode npm package |
| Configuration | Static JSON |
| Face Index | Static JSON files |

All services must operate within their available free-tier limits.

## 3. System Architecture

The application will use one website with multiple event configurations.

Each event will have:

- Unique event ID.
- Event name.
- Google Drive folder ID.
- Unique public URL.
- Unique QR code.
- Separate face index.

Example:

    Website
    |
    |-- Event: wedding-2026
    |     |-- Google Drive Folder A
    |     |-- face-index.json
    |     |-- QR Code A
    |
    |-- Event: cu-reunion
    |     |-- Google Drive Folder B
    |     |-- face-index.json
    |     |-- QR Code B
    |
    |-- Event: birthday-2026
          |-- Google Drive Folder C
          |-- face-index.json
          |-- QR Code C

All events share the same application and face-recognition engine.

## 4. Functional Requirements

### FR-01: Multiple Event Configuration

- Support multiple Google Drive folders.
- Each folder represents one event.
- Assign a unique event ID to every event.
- Store event information in a static JSON configuration file.
- Display the corresponding event name when visitors open its URL.
- Reject unknown or invalid event IDs.
- Prevent duplicate event IDs.

Example configuration:

    {
      "events": [
        {
          "id": "wedding-2026",
          "name": "Wedding 2026",
          "folderId": "GOOGLE_DRIVE_FOLDER_ID_1",
          "indexPath": "/indexes/wedding-2026.json"
        },
        {
          "id": "cu-reunion",
          "name": "CU Reunion",
          "folderId": "GOOGLE_DRIVE_FOLDER_ID_2",
          "indexPath": "/indexes/cu-reunion.json"
        }
      ]
    }

### FR-02: Permanent QR Code Generation

- Generate a unique QR code for each event.
- QR code must contain the production website URL and event ID.
- QR codes must not contain localhost or private IP addresses.
- Generate QR codes in PNG format.
- Allow QR codes to be downloaded and printed.
- QR codes must remain unchanged after deployment.
- All QR codes must continue working when the developer's PC is switched off.

Example URLs:

    https://yourwebsite.pages.dev/event/wedding-2026

    https://yourwebsite.pages.dev/event/cu-reunion

    https://yourwebsite.pages.dev/event/birthday-2026

### FR-03: Google Drive Integration

- Retrieve photographs from the event-specific Google Drive folder.
- Extract the folder ID from the configured event.
- Use Google Drive API.
- Retrieve image metadata.
- Support API pagination.
- Support JPG, JPEG, and PNG.
- Support WEBP where browser decoding is available.
- Ignore unsupported files.
- Do not modify, move, or delete original photographs.
- Handle inaccessible folders and unavailable images gracefully.

### FR-04: Event Isolation

- Each QR code must access only its corresponding event.
- Each event must use its own Google Drive folder.
- Each event must use its own face index.
- Never compare photographs from unrelated events.
- Do not expose other event configurations unnecessarily.
- Unknown event IDs must return an appropriate error page.

### FR-05: Selfie Capture

- Request camera permission.
- Support front-facing mobile cameras.
- Allow visitors to capture a selfie.
- Allow visitors to retake their selfies.
- Validate that a face is detected.
- Display appropriate camera permission errors.
- Obtain informed consent before processing.

### FR-06: Face Detection and Matching

- Use a browser-based face recognition library.
- Detect the visitor's face.
- Generate a temporary face descriptor.
- Compare the visitor's face against indexed event photographs.
- Support photographs containing multiple faces.
- Use an appropriate face-distance calculation.
- Apply a configurable matching threshold.
- Return potential matching photographs.
- Handle false positives and false negatives.

Face matching must not be treated as verified identity authentication.

### FR-07: Face Indexing

Create a separate reusable face index for every Google Drive folder.

Example directory:

    public/
      indexes/
        wedding-2026.json
        cu-reunion.json
        birthday-2026.json

Each index should contain:

- Image ID.
- Image name.
- Image metadata.
- Detected face descriptors.
- Face bounding-box information.
- Required image access information.

Requirements:

- Generate indexes through a separate maintenance process.
- Avoid regenerating an entire index for every visitor search.
- Support index regeneration when new photographs are added.
- Keep indexes isolated by event.
- Do not store visitor selfies or their face descriptors.
- Do not include private credentials in index files.

### FR-08: Search Results

Display:

- Matching photographs.
- Total number of matching photographs.
- Image previews.
- Original photograph links.
- Download options where permitted.
- Search-again button.

Sort results by similarity.

If no matching photograph is found, display a helpful message.

### FR-09: Performance Optimization

- Process images in batches.
- Use resized images for face detection.
- Avoid loading all original photographs simultaneously.
- Display search progress.
- Implement lazy loading.
- Release temporary image resources.
- Avoid excessive browser memory consumption.
- Cache reusable image metadata where appropriate.

## 5. User Interface Requirements

### 5.1 Landing / Event Page

- Display application name and logo.
- Display event name.
- Explain the photo-finding process.
- Provide a Start Searching button.
- Display privacy and consent information.

### 5.2 Selfie Capture Page

- Camera preview.
- Capture button.
- Retake button.
- Continue button.
- Camera permission error message.

### 5.3 Processing Page

- Search progress indicator.
- Number of indexed photographs.
- Number of faces checked.
- Processing status.

### 5.4 Results Page

- Matching photographs in a responsive grid.
- Image preview.
- View/download options.
- Search again button.
- No-results message.

## 6. Security Requirements

- HTTPS is mandatory.
- Never expose private API credentials.
- Never expose Google service account private keys.
- Use restricted Google Drive access where possible.
- Validate event IDs.
- Validate file types and API responses.
- Prevent unauthorized access to private photographs.
- Do not permanently store visitor biometric information.

For private Drive folders, implement secure Google OAuth integration or another server-side authorization mechanism. Never place private OAuth client secrets in frontend code.

## 7. Privacy Requirements

- Obtain visitor consent before face processing.
- Process selfies locally in the browser.
- Do not upload or permanently store selfies.
- Delete temporary face descriptors after searching.
- Do not use photographs for model training.
- Process only photographs the organizer has permission to use.
- Provide clear information about photograph access and sharing.

## 8. Deployment Requirements

### Hosting

- Host the frontend on Cloudflare Pages.
- Use GitHub for source-code management.
- Configure production environment variables.
- Enable HTTPS.
- Configure production routing for event-specific URLs.

### Independence from Local Computer

The application must:

- Run entirely from the deployed cloud-hosted website.
- Not depend on localhost.
- Not require a local backend process.
- Not require the developer's PC to remain switched on.
- Retrieve photographs through the configured cloud integration.
- Support access from different devices and networks.

### QR Code Stability

- QR codes must point to the permanent production domain.
- Avoid temporary development URLs.
- Do not change event IDs after QR distribution.
- Maintain the production website URL.

## 9. Configuration and Maintenance

Since the application does not have an admin dashboard or database, event configuration will be maintained through static files.

To add another event:

1. Obtain a Google Drive folder ID.
2. Add a new event entry to the configuration JSON.
3. Generate its separate face index.
4. Generate a QR code using the event URL.
5. Deploy the updated application.
6. Distribute the QR code.

Existing event QR codes must continue working after subsequent deployments.

When new photographs are added to an existing folder, regenerate that event's index and deploy the updated index.

## 10. Project Limitations

- Google Drive is not a native face-search engine.
- Face matching happens in the application.
- Google Drive API has quotas.
- Free hosting has bandwidth and resource limitations.
- Browser performance depends on the visitor's device.
- Large image collections require face indexing.
- Publicly accessible folders may expose original photographs.
- Private folders require secure authorization.
- Static configuration changes require a deployment.
- Free-tier services cannot guarantee unlimited usage.

## 11. Acceptance Criteria

- [ ] One website supports multiple events.
- [ ] Each event has a unique permanent URL.
- [ ] Each event has its own QR code.
- [ ] QR codes work when the developer's PC is switched off.
- [ ] Each event connects to its correct Google Drive folder.
- [ ] Event photographs are isolated.
- [ ] Separate face indexes are maintained.
- [ ] Visitors can capture selfies.
- [ ] Face detection works.
- [ ] Multiple faces can be detected in photographs.
- [ ] Matching photographs are displayed.
- [ ] Visitors can view or download accessible photographs.
- [ ] No database is required.
- [ ] No admin dashboard is required.
- [ ] No visitor registration is required.
- [ ] Selfies are not permanently stored.
- [ ] Application works on mobile and desktop.
- [ ] The system operates within free-tier limits.

## 12. Development Phases

### Phase 1: Project Setup
- Initialize React + Vite + TypeScript.
- Configure Tailwind CSS.
- Create responsive application structure.
- Deploy initial version to Cloudflare Pages.

### Phase 2: Event Configuration
- Create static event configuration.
- Implement event-specific routing.
- Validate event IDs.
- Display event names.

### Phase 3: QR Code Generation
- Integrate QR generation library.
- Generate unique QR codes.
- Test event-specific URLs.
- Verify permanent URL behavior.

### Phase 4: Google Drive Integration
- Configure Google Drive API.
- Retrieve image metadata.
- Implement pagination.
- Handle image access and errors.

### Phase 5: Face Recognition
- Integrate Human / TensorFlow.js.
- Implement selfie capture.
- Implement face detection.
- Implement face comparison.

### Phase 6: Face Indexing
- Create an indexing process.
- Generate separate event indexes.
- Implement index loading.
- Implement index regeneration.

### Phase 7: Results and Optimization
- Display matching photographs.
- Implement batch processing.
- Optimize memory usage.
- Implement lazy loading.

### Phase 8: Testing and Deployment
- Test multiple events.
- Test multiple QR codes.
- Test with different devices.
- Test large image collections.
- Verify PC-independent operation.
- Test privacy and security requirements.

---

## 13. Final Deliverable

A publicly hosted, database-free, multi-event selfie photo finder.

The application will support multiple permanent QR codes, each connected to a different Google Drive folder. Visitors can scan an event-specific QR code, take a selfie, and find their matching photographs.

The application must operate independently of the developer's personal computer and use free-tier services wherever technically possible.