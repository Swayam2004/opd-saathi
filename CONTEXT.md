# OPD Saathi

A queue and wayfinding system for the outpatient department (OPD) of a government hospital. It lets a patient register, get a token, follow their turn and find the room, and lets staff run the queues.

## Language

### People

**Patient**:
A person who has come to the hospital for care and has registered or is registering for an OPD visit.
_Avoid_: User, customer, client

**Helper**:
A person who fills in registration or reads the screen on a patient's behalf. Present when assisted mode is on.
_Avoid_: Caregiver, attendant, guardian

**Staff**:
Hospital employees who run queues, call tokens and assess urgent cases. Includes the registration counter operator and the nurse.
_Avoid_: Admin, operator, employee

**Doctor**:
The clinician in a room who consults patients. Appears in the product only through their status and name on the slip.
_Avoid_: Physician, consultant

### Registration and queue

**OPD slip**:
The printed or on-screen record of a visit: token, department, room, floor, doctor's name, people ahead, estimated wait, and a QR code. Shows first name only.
_Avoid_: Ticket, receipt, pass

**Token**:
The short code identifying a patient's place in a department's queue, such as MED-042. Prefix is the department it was first issued in, number is the order issued that day. Moving a patient to another department keeps the token.
_Avoid_: Queue number, ticket number, ID

**Department**:
A clinical specialty with one or more rooms and a queue, such as General Medicine or Eyes.
_Avoid_: Clinic, speciality, unit

**Queue**:
The ordered list of waiting tokens for one department.
_Avoid_: Line, waitlist

**Now serving**:
The token a department is currently consulting or has just called.
_Avoid_: Current token, active token

**Called**:
The state of a token when staff have summoned that patient to the room. The patient's screen switches to the called view.
_Avoid_: Notified, paged

**No-show**:
A called token whose patient did not arrive. Staff mark it; it leaves the queue.
_Avoid_: Absent, skipped

**Send to end**:
Staff action that moves a token to the back of its queue.
_Avoid_: Requeue, defer

**Estimated wait**:
People ahead multiplied by the department's recent average consultation time, plus the doctor's delay, rounded to 5 minutes. Always shown as "about".
_Avoid_: ETA, waiting time (as a promise)

**Wait range**:
The span a patient's wait usually falls in, shown beside the estimated wait, such as "about 25 minutes, usually 15 to 40". Rounded to 5 minutes and at least 10 minutes wide. Never tells anyone they can leave or wait.
_Avoid_: Confidence interval, accuracy

**Calibration readout**:
A staff-side figure: the share of finished patients whose actual wait fell inside the wait range they were shown.
_Avoid_: Accuracy score, model metric

**Consultation time**:
How long a doctor takes with one patient. The average of the last 10 per department drives the estimated wait.
_Avoid_: Service time, visit length

**Doctor status**:
Whether a doctor is available, on a break until a stated time, or running late by some minutes. Patients see it immediately.
_Avoid_: Availability, presence

**Overcrowding**:
How full a waiting area is, as people waiting compared with its seats. Shown to staff as a colour plus a word.
_Avoid_: Congestion, load

### Emergency

**Emergency (Casualty)**:
The hospital department for urgent care. Reachable without registration or a token.
_Avoid_: ER, A&E, trauma centre

**Urgent flag**:
A signal raised by a patient or helper that someone needs staff attention now. Pinned at the top of the staff dashboard, with a sound, until a staff member marks it seen.
_Avoid_: Alert, SOS, panic

**Emergency signs**:
The list of symptoms shown at the start of registration that mean "go to Emergency now". Informational; the app does not triage.
_Avoid_: Triage, red flags

### Place and routing

**Place**:
Any named location on a floor plan, such as Room 3, Pharmacy or Lift. Has a floor, an x/y position and one landmark.
_Avoid_: Location, point, node (in product language)

**Landmark**:
The one visible thing that helps a person recognise a place, such as "opposite the blue chairs".
_Avoid_: Hint, marker

**Path**:
A walkable link between two places, with a distance in metres and whether it uses stairs.
_Avoid_: Edge, corridor, connection

**Route**:
The shortest sequence of paths from one place to another, shown on the floor plan and as written steps.
_Avoid_: Directions (use "steps" for the written form), navigation

**Avoid stairs**:
A routing option that excludes stair paths so the route uses lifts and ramps only. On by default in assisted mode.
_Avoid_: Accessible mode, step-free

**Out of service**:
The state staff set on a lift, ramp or other place that cannot be used. Routes avoid it at once. When no route is left, the patient is sent to the Help desk.
_Avoid_: Broken, down, closed

**Help desk**:
The ground-floor desk where staff help patients who are lost or unsure which department they need.
_Avoid_: Information counter, reception

### Modes and surfaces

**Assisted mode**:
A setting for a patient with a helper: larger text, everything read aloud, avoid stairs on, a helper can fill in the forms.
_Avoid_: Elder mode, simple mode, caregiver mode

**Waiting-room board**:
The large-screen view at `/board` showing the token being served in each room, the next three tokens and any delays, alternating English and Hindi, and announcing called tokens aloud.
_Avoid_: TV screen, display, kiosk

**Registration counter**:
The staff screen for registering a patient who has no phone or needs help, and printing their slip.
_Avoid_: Front desk, reception screen

**Staff dashboard**:
The staff screen at `/staff` showing every department's queue, doctor statuses, overcrowding and urgent flags.
_Avoid_: Admin panel, control room

**Daily report**:
A per-department summary of a day's queue: patients seen, waits, no-show rate and peak overcrowding. Staff start it from the staff dashboard.
_Avoid_: Analytics, export

**Demo controls**:
Staff-dashboard tools that add 20 sample patients, speed time up 10 times and reset everything, so a full flow runs in two minutes.
_Avoid_: Debug panel, simulator
