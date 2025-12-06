# FlowState Auth Pages Design

## Overview

Auth pages provide entry into the FlowState universe. Design emphasizes the cosmic theme while keeping forms simple and accessible.

---

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | Existing user sign in |
| Register | `/register` | New user sign up |
| Forgot Password | `/forgot-password` | Password reset request |
| Reset Password | `/reset-password` | Set new password |

---

## Login Page

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✦ FlowState Logo                         │
│                                                             │
│                  "Enter the Void"                           │
│                                                             │
│              ┌─────────────────────────┐                    │
│              │  Email                  │                    │
│              └─────────────────────────┘                    │
│              ┌─────────────────────────┐                    │
│              │  Password          👁   │                    │
│              └─────────────────────────┘                    │
│                                                             │
│              [      Sign In       ]                         │
│                                                             │
│              ─────── or continue with ───────               │
│                                                             │
│              [ GitHub ]    [ Google ]                       │
│                                                             │
│              Forgot password?                               │
│                                                             │
│              ─────────────────────────                      │
│              New to FlowState? Create account               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Background: Animated star field with subtle nebula
```

### Elements

| Element | Design |
|---------|--------|
| Background | Deep void (#05080f) with animated stars |
| Logo | FlowState wordmark + constellation icon |
| Card | Glass panel with subtle border glow |
| Inputs | Dark fields with cyan focus ring |
| Primary Button | Gradient cyan, glow on hover |
| OAuth Buttons | Outlined, icon + text |
| Links | Cyan accent color |

### States

| State | Visual Feedback |
|-------|-----------------|
| Loading | Button shows spinner, inputs disabled |
| Error | Red border on field, error message below |
| Success | Redirect with transition animation |

---

## Register Page

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✦ FlowState Logo                         │
│                                                             │
│                "Begin Your Journey"                         │
│                                                             │
│              ┌─────────────────────────┐                    │
│              │  Name                   │                    │
│              └─────────────────────────┘                    │
│              ┌─────────────────────────┐                    │
│              │  Email                  │                    │
│              └─────────────────────────┘                    │
│              ┌─────────────────────────┐                    │
│              │  Password          👁   │                    │
│              └─────────────────────────┘                    │
│              Password strength: ████░░░░ Good               │
│                                                             │
│              [     Create Account     ]                     │
│                                                             │
│              ─────── or continue with ───────               │
│                                                             │
│              [ GitHub ]    [ Google ]                       │
│                                                             │
│              ─────────────────────────                      │
│              Already have an account? Sign in               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Password Strength Indicator

| Strength | Color | Criteria |
|----------|-------|----------|
| Weak | Red | < 8 chars |
| Fair | Orange | 8+ chars |
| Good | Yellow | 8+ chars, mixed case |
| Strong | Green | 8+ chars, mixed case, numbers, symbols |

---

## Forgot Password Page

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✦ FlowState Logo                         │
│                                                             │
│                "Recover Your Path"                          │
│                                                             │
│         Enter your email and we'll send you                 │
│         a link to reset your password.                      │
│                                                             │
│              ┌─────────────────────────┐                    │
│              │  Email                  │                    │
│              └─────────────────────────┘                    │
│                                                             │
│              [    Send Reset Link    ]                      │
│                                                             │
│              ─────────────────────────                      │
│              Back to sign in                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Success State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                       ✉️                                    │
│                                                             │
│                "Check Your Email"                           │
│                                                             │
│         We've sent a reset link to                          │
│         user@example.com                                    │
│                                                             │
│         Didn't receive it? Check spam or                    │
│         [Resend email]                                      │
│                                                             │
│              ─────────────────────────                      │
│              Back to sign in                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual Design

### Background Animation

- Slow-moving star field
- Subtle nebula clouds
- Gentle parallax on mouse move
- Reduced motion: static gradient

### Glass Card

| Property | Value |
|----------|-------|
| Background | rgba(10, 22, 40, 0.8) |
| Border | 1px solid rgba(0, 212, 255, 0.2) |
| Border Radius | 16px |
| Backdrop Filter | blur(20px) |
| Box Shadow | 0 0 40px rgba(0, 212, 255, 0.1) |

### Form Inputs

| State | Style |
|-------|-------|
| Default | bg-void-surface, border-void-atmosphere |
| Focus | border-accent-primary, ring-2 ring-accent-primary/30 |
| Error | border-accent-warning, text-accent-warning |
| Disabled | opacity-50, cursor-not-allowed |

---

## Transitions

| Action | Animation |
|--------|-----------|
| Page Enter | Fade in + scale from 0.95 |
| Login Success | Card morphs into expanding ring, fade to dashboard |
| Error Shake | Horizontal shake on form card |
| OAuth Redirect | Fade out with particle burst |

---

## Accessibility

- All form fields have labels
- Error messages linked via aria-describedby
- Focus visible on all interactive elements
- OAuth buttons have descriptive text
- Reduced motion respects prefers-reduced-motion
- Minimum touch targets 44x44px

---

## Mobile Responsive

| Breakpoint | Adjustments |
|------------|-------------|
| < 640px | Full-width card, smaller padding |
| < 768px | Stacked OAuth buttons |
| >= 1024px | Centered card with max-width 400px |
