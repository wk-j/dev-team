# 🚀 FlowState - Quick Reference

## 📍 Pages

| Page | URL | Purpose |
|------|-----|---------|
| Observatory | `/observatory` | 3D main view, dive into streams |
| Streams | `/streams` | Grid view, create streams & items |
| Constellation | `/constellation` | Team view, send pings |
| Team | `/team` | Manage members & invites |
| Sanctum | `/sanctum` | Personal settings |

## ⚡ Quick Actions

### Create Work Item
```
/streams → Click "+ Spark Item" on any stream
```

### Send Ping
```
/constellation → View Profile → "Send Ping"
```

### Handoff Work
```
/constellation → View Profile → "Infuse Energy"
```

### Add Team Member
```
/team → "+ Invite" → Send invite link
```

## 🎨 Work Item States

| State | Symbol | Meaning |
|-------|--------|---------|
| Dormant | ○ | Not started |
| Kindling | ◐ | Just started |
| Blazing | ● | Active work |
| Cooling | ◑ | Nearly done |
| Crystallized | ◇ | Completed |

## 🔧 CLI Commands

```bash
# Add work items
npx tsx --env-file=.env add-real-work.ts

# View database
npm run db:studio

# Type check
npm run typecheck

# Dev server
npm run dev
```

## 🎯 Key Shortcuts

- **Drag** - Rotate 3D view
- **Scroll** - Zoom in/out
- **Click stream** - Dive into stream
- **Click member** - View profile

---

**Everything is ready to use!** 🎉
