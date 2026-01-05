# Tournament Admin UI Guide

## ✨ Tổng quan

Admin UI để quản lý tournaments với thiết kế **mobile-first, hiện đại và dễ sử dụng** theo shadcn/ui.

## 📱 Features

### 1. **Tournament List** (Main Page)
- ✅ Card-based layout (responsive grid)
- ✅ Real-time search
- ✅ Filter by Status & Game Type
- ✅ Stats overview (Total, Active, Upcoming, Completed)
- ✅ Mobile-friendly với collapsible filters
- ✅ Pagination
- ✅ Quick actions menu (Edit/Delete)

### 2. **Create/Edit Tournament Form**
- ✅ Smart progressive form flow
- ✅ Auto-hide irrelevant fields based on tournament type
- ✅ Clear visual sections
- ✅ Form validation
- ✅ Mobile-optimized dialog

### 3. **Tournament Types Support**
- ✅ Single Stage - Single Elimination
- ✅ Single Stage - Round Robin
- ✅ Two Stages (Group + Final)

---

## 🚀 How to Use

### Access the UI

1. **Start the admin portal:**
   ```bash
   cd apps/admin-portal
   yarn dev
   ```

2. **Login as admin:**
   - Go to `http://localhost:3001/login`
   - Use admin credentials

3. **Navigate to Tournaments:**
   - Click "Tournaments 🏆" in the sidebar
   - Or go directly to `http://localhost:3001/tournaments`

---

## 📋 UI Flow

### Creating a Tournament

#### Step 1: Click "Create Tournament"
![Create Button](Mobile & Desktop có button ở top-right)

#### Step 2: Fill Basic Info
```
✓ Tournament Name (required)
✓ Description (optional)
✓ Registration Start Time (optional)
✓ Mark as tentative (checkbox)
```

#### Step 3: Choose Tournament Type

**Option A: Single Stage**
- Select format: Single Elimination or Round Robin
- **If Single Elimination:**
  - Choose 3rd place match: Yes (Tranh 3-4) or No (Đồng hạng 3)
- **If Round Robin:**
  - Set matchups per pair (default: 1)

**Option B: Two Stages**
- **Group Stage config:**
  - Participants per group (2-20, default: 4)
  - Participants advancing (default: 2)
  - Matchups per pair (default: 1)
- **Final Stage config:**
  - 3rd place match: Yes or No

#### Step 4: Submit
- Form validates automatically
- Shows success/error message
- Redirects to tournament list

---

## 🎨 UI Design Highlights

### Mobile-First Approach

**Mobile (< 768px):**
- Single column cards
- Collapsible filters (toggle button)
- Full-width buttons
- Stacked stats
- Touch-friendly spacing

**Desktop (>= 768px):**
- 2-3 column grid
- Always visible filters
- Side-by-side layout
- Hover effects

### Color Scheme

**Tournament Status:**
- 🟤 DRAFT - Gray
- 🔵 PENDING - Blue
- 🟢 IN_PROGRESS - Green
- 🟣 COMPLETED - Purple
- 🔴 CANCELLED - Red

**Components:**
- Cards with shadow on hover
- Primary button for CTA
- Outline buttons for secondary actions
- Ghost buttons for menu items

---

## 📸 UI Screenshots Flow

### 1. Empty State
```
┌─────────────────────────────────────┐
│  🏆 Tournaments                     │
│  Manage tournament brackets        │
│                                    │
│  [+ Create Tournament]             │
└─────────────────────────────────────┘
│  Search: [.................]        │
│  [Show Filters ▼]                  │
└─────────────────────────────────────┘
│  Total: 0  Active: 0  Upcoming: 0  │
└─────────────────────────────────────┘
│         🏆                          │
│    No tournaments found            │
│  Create your first tournament      │
└─────────────────────────────────────┘
```

### 2. Tournament List View
```
┌─────────────────────────────────────┐
│  🏆 Tournaments                     │
│  Manage tournament brackets        │
│                                    │
│              [+ Create Tournament] │
└─────────────────────────────────────┘
│  Search: [.................]  🔍   │
│  Status: [All Status ▼]            │
│  Type:   [All Types ▼]             │
│  [Apply Filters]                   │
└─────────────────────────────────────┘
│  Total: 12  Active: 2  Upcoming: 3 │
└─────────────────────────────────────┘
│ ┌─────────────┐ ┌─────────────┐   │
│ │Championship │ │Spring League│   │
│ │2026         │ │             │   │
│ │Annual...    │ │Round robin..│   │
│ │[In Progress]│ │[Pending]    │   │
│ │[Single Stg] │ │[Single Stg] │   │
│ │👥 16  📅 ... │ │👥 8   📅 ...│   │
│ │[View Details]│ │[View Details]│   │
│ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

### 3. Create Form (Mobile)
```
┌─────────────────────────────────────┐
│  Create Tournament              [X] │
│  Set up a new tournament...        │
├─────────────────────────────────────┤
│  Basic Information                 │
│                                    │
│  Tournament Name *                 │
│  [........................]        │
│                                    │
│  Description                       │
│  [........................]        │
│  [........................]        │
│                                    │
│  Registration Start                │
│  [2026-01-15T10:00]               │
│                                    │
│  ☐ Mark as tentative              │
├─────────────────────────────────────┤
│  Tournament Type *                 │
│                                    │
│  ⦿ Single Stage                    │
│    One bracket format              │
│                                    │
│  ○ Two Stages                      │
│    Group stage + Finals            │
├─────────────────────────────────────┤
│  Single Stage Configuration        │
│                                    │
│  Format *                          │
│  [Single Elimination ▼]           │
│                                    │
│  3rd Place Match                   │
│  ⦿ Yes - Tranh 3-4                │
│  ○ No - Đồng hạng 3               │
├─────────────────────────────────────┤
│        [Cancel]  [Create]          │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Files Created

```
apps/admin-portal/
├── src/
│   ├── app/
│   │   └── tournaments/
│   │       ├── page.tsx                    # Main page (server)
│   │       ├── layout.tsx                  # Layout wrapper
│   │       ├── tournaments-client.tsx      # List component (client)
│   │       └── tournament-form-dialog.tsx  # Form modal (client)
│   ├── types/
│   │   └── tournament.ts                   # TypeScript types
│   ├── lib/
│   │   └── api-client.ts                   # Added tournamentsApi
│   └── components/
│       └── admin/
│           └── sidebar.tsx                 # Added Tournaments menu
```

### API Integration

```typescript
// Import API client
import { tournamentsApi } from '@/lib/api-client';

// List tournaments
const result = await tournamentsApi.listTournaments({
  page: 1,
  limit: 20,
  status: 'PENDING',
  gameType: 'SINGLE_STAGE',
});

// Create tournament
await tournamentsApi.createTournament(data);

// Update tournament
await tournamentsApi.updateTournament(id, data);

// Delete tournament
await tournamentsApi.deleteTournament(id);
```

---

## 🎯 Key Features

### 1. Real-time Search
- Tìm theo tên tournament
- Tìm theo description
- Không cần click "Search", auto-filter khi typing

### 2. Smart Filters
- **Mobile:** Toggle show/hide filters để tiết kiệm không gian
- **Desktop:** Always visible
- Filter by status và game type
- Apply button để fetch từ server

### 3. Progressive Form
- Form chỉ hiện fields relevant
- Single Stage → Chỉ hiện Single Stage config
- Two Stages → Hiện cả Group + Final configs
- Auto-focus vào field đầu tiên

### 4. Responsive Design
- Mobile: 1 column cards
- Tablet: 2 columns
- Desktop: 3 columns
- Stats: 1 row (mobile), 4 columns (desktop)

### 5. User Feedback
- Loading states khi fetch data
- Success/Error messages
- Confirmation dialogs cho delete
- Disabled states khi processing

---

## 📝 Form Validation

### Required Fields:
- ✅ Tournament Name
- ✅ Game Type
- ✅ Format (cho Single Stage)
- ✅ Group config (cho Two Stages)

### Auto-validation:
- Participants advancing < Participants per group
- Matchups per pair: 1-3
- Participants per group: 2-20

---

## 🚦 Next Steps

Sau khi UI này hoạt động, bạn có thể thêm:

1. **Tournament Detail Page** (`/tournaments/[id]`)
   - View full tournament info
   - Manage participants
   - View bracket/schedule
   - Update match results

2. **Quick Actions**
   - Publish tournament (DRAFT → PENDING)
   - Start tournament (PENDING → IN_PROGRESS)
   - Complete tournament

3. **Bulk Operations**
   - Multi-select tournaments
   - Bulk delete
   - Bulk status change

4. **Advanced Filters**
   - Date range filter
   - Sort by different fields
   - Save filter presets

---

## 💡 Tips for Using the UI

### For Mobile Users:
1. Use "Show Filters" button để toggle filters
2. Swipe cards để xem full content
3. Tap "..." menu để edit/delete

### For Desktop Users:
1. Filters always visible - no need to toggle
2. Hover cards để xem shadow effect
3. Use keyboard shortcuts (coming soon)

### Pro Tips:
1. **Quick Create:** Click "+ Create Tournament" from anywhere
2. **Search First:** Use search trước khi apply filters để nhanh hơn
3. **Card View:** Nhìn quick overview mà không cần vào detail page

---

## 🎉 Summary

✅ **Mobile-first responsive design**
✅ **Shadcn/ui components**
✅ **Smart progressive forms**
✅ **Real-time search & filters**
✅ **Beautiful card-based layout**
✅ **Full CRUD operations**
✅ **TypeScript type-safe**
✅ **Error handling & loading states**

**Ready to use!** 🚀

Bây giờ bạn có thể:
1. Start admin portal
2. Login as admin
3. Click "Tournaments" trong sidebar
4. Create your first tournament! 🏆
