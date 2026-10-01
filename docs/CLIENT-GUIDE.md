# College Bites — running the app

A short guide for the College Bites team. The site is
**https://collegebitessrm.vercel.app** — it works in any phone browser and
can be added to the home screen like an app.

---

## Getting into admin

1. Sign in on the site with Google, using an **admin account**
   (today: collegebitessrm@gmail.com and nagaadithya999@gmail.com).
2. Open **https://collegebitessrm.vercel.app/admin**.
3. Enter the **admin passcode** (ask the developer; it is never written
   down in the app or sent in chat).

A new admin account can only be added by the developer.

## Every day

### Open or close ordering

The big coloured **Today** card at the top of admin has an
**Open / Closed** switch.

- **Open** — students can order from every restaurant that's turned on.
  It stays open until you close it; there is no automatic schedule.
- **Closed** — nobody can place a new order, and **every restaurant is
  turned off**. Orders already placed are not affected.
- After re-opening, turn on the restaurants you want under **Restaurants**
  (tapping **Turn on** while ordering is closed offers to re-open it).

### New orders

- Tap **Turn on alerts** (the bell) once on each phone: you'll get a
  **push notification** for every new order, even with the page closed.
- While the admin page is open, a **loud alarm** plays for every new
  order. Browsers only allow sound after a tap, so each time you open
  admin, tap **Tap to arm sound** until the button says **Alerts on**.

### Handling an order

Each order card shows the **token number** (e.g. #12 — the student shows
this at the gate), the restaurant, each dish with quantity and price, the
student's note, name and number.

1. **WhatsApp** — opens a chat with the student with the order already
   typed out. Ask them to reply "yes".
2. **Confirm** — once they've confirmed. The student gets a notification.
3. **Copy** — copies restaurant, dishes, name and number, to paste to the
   restaurant.
4. **Mark delivered** — once they've collected it at **Gate 3**.
5. **Cancel** — if it can't go ahead. The student is notified.

**Mark all delivered** marks every confirmed order delivered at once.

Tap any card for the full details page (phone, email, registration
number, timings).

### Delivery times the students see

- **Triangle Food Court** and **Local Home Kitchen**: delivery within
  **40 minutes** of ordering.
- **Clg Bites Biryani Nation**: within **1 hour**.

The ticket shows "Delivery by" that time. To change these times, ask the
developer.

## When something changes

| You want to… | Do this |
|---|---|
| Stop one restaurant for a while | **Restaurants** → **Turn off** (turn it on again later) |
| Mark a dish as sold out | **Sold out** → find the dish → **Sold out** (tap **Back on sale** to bring it back) |
| Block someone who keeps not collecting | **Users** → **Banned users** → search them → **Ban** → **Ban student** (tap **Unban** to undo). This blocks their **phone number**, so a new Google account with the same number is blocked too. |
| See every past order | **Order history** (with filters and "Export to Excel") |
| Read ratings | **Reviews** — dish averages and notes; only admins ever see these |
| Hand over a free biryani | A student who unlocks all 6 milestones messages you on WhatsApp. After handing it over: **Users** → filter "Free biryani earned" → **Mark claimed** (there's an Undo) |
| Change prices, add or rename dishes or restaurants | Ask the developer — menu changes are made in the database |

## Payments

Pay on delivery — students pay by cash or UPI when they collect at Gate 3.
The app itself never takes payments.

## Support details students see

- Call / WhatsApp: **+91 99899 55833**
- Email (privacy page): **collegebitessrm@gmail.com**

## If something looks wrong

- Pull down to refresh, or tap **Reload** in the admin header.
- A page that says "Token #404" (with a little scooter lost on the road) is
  just a wrong link.
- Anything else: contact the developer with a screenshot and what you
  tapped.
