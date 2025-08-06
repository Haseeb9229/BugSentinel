# Mobile/Desktop Scanning Implementation Plan

## 📋 Overview

Currently, BugSentinel only scans websites in desktop mode. We need to implement dual scanning (both mobile and desktop) and add a toggle functionality to switch between device-specific data across all pages.

## 🎯 Goals

1. **Dual Scanning**: Run scans for both desktop and mobile devices
2. **Device Toggle**: Add toggle switch to view device-specific data
3. **Separate Data**: Store and display device-specific metrics, bugs, and performance data
4. **Enhanced UX**: Better insights into mobile vs desktop user experience

## 📊 Current State Analysis

### Current Scanning Configuration
- **Viewport**: Desktop only (1366x768)
- **User Agent**: Desktop browser
- **Lighthouse**: Desktop mode only
- **Data Storage**: Single device type (implicitly desktop)

### Current Pages Affected
- Dashboard
- Bug Reports
- Performance
- Monitoring
- Alerts

## 🏗️ Implementation Strategy

### Phase 1: Database Schema Updates

#### Tables to Modify
1. **performance_metrics** - Add `device_type` column
2. **bugs** - Add `device_type` column  
3. **scans** - Add `device_type` column

#### Schema Changes
```sql
-- Add device type columns
ALTER TABLE performance_metrics ADD COLUMN device_type TEXT DEFAULT 'desktop';
ALTER TABLE bugs ADD COLUMN device_type TEXT DEFAULT 'desktop';
ALTER TABLE scans ADD COLUMN device_type TEXT DEFAULT 'desktop';
```

### Phase 2: Backend Changes

#### Files to Modify
1. **shared/schema.ts** - Update TypeScript interfaces
2. **server/scanning/scan-engine.ts** - Add device type support
3. **server/scanning/web-crawler.ts** - Mobile viewport configuration
4. **server/scanning/lighthouse-scanner.ts** - Mobile Lighthouse settings
5. **server/routes.ts** - API endpoints with device filtering

#### Key Changes
- **Scan Engine**: Accept device type parameter
- **Web Crawler**: Configure viewport based on device (375x667 for mobile, 1366x768 for desktop)
- **Lighthouse**: Set formFactor and screenEmulation for mobile/desktop
- **API Routes**: Add device type filtering to all endpoints

### Phase 3: Frontend Changes

#### New Component
- **Device Toggle Component**: Switch between mobile/desktop views

#### Pages to Update
1. **Dashboard** - Device-specific metrics and store health
2. **Bug Reports** - Filter bugs by device type
3. **Performance** - Device-specific Lighthouse scores
4. **Monitoring** - Device-specific performance data (uptime stays universal)
5. **Alerts** - Device-specific alert thresholds

#### UI Changes
- Add device toggle to page headers
- Update API calls to include device type parameter
- Filter displayed data based on selected device
- Update charts and metrics to show device-specific values

## 📱 Mobile Configuration

### Viewport Settings
- **Mobile**: 375x667 (iPhone SE)
- **Desktop**: 1366x768 (Standard desktop)

### User Agents
- **Mobile**: iPhone Safari user agent
- **Desktop**: Custom BugSentinel scanner user agent

### Lighthouse Settings
- **Mobile**: formFactor: 'mobile', mobile screen emulation
- **Desktop**: formFactor: 'desktop', desktop screen emulation

## 🔄 Data Flow

### Scan Process
1. User triggers scan (manual or scheduled)
2. System runs scan for both devices (or selected device)
3. Store results with device type identifier
4. Update dashboards and reports

### Toggle Process
1. User switches device toggle
2. Frontend updates API calls with device type
3. Backend filters data by device type
4. UI updates to show device-specific information

## 📊 Expected Benefits

### For Merchants
- **Mobile Insights**: Understand mobile user experience
- **Device Comparison**: Compare performance across devices
- **Targeted Fixes**: Address device-specific issues
- **Better UX**: Improve mobile conversion rates

### For BugSentinel
- **Competitive Advantage**: Mobile-first monitoring
- **Better Analytics**: Device-specific insights
- **Enhanced Value**: More comprehensive monitoring

## 🧪 Testing Strategy

### Test Scenarios
1. **Desktop Scan**: Verify desktop data creation
2. **Mobile Scan**: Verify mobile data creation
3. **Toggle Functionality**: Switch between device views
4. **Data Filtering**: Ensure correct device-specific data display
5. **Performance Metrics**: Verify device-specific Lighthouse scores
6. **Bug Reports**: Filter bugs by device type
7. **Dashboard Metrics**: Show device-specific store health

### Validation Points
- [ ] Desktop scans create desktop data
- [ ] Mobile scans create mobile data
- [ ] Toggle switches between device data correctly
- [ ] Performance metrics are device-specific
- [ ] Bug reports filter by device type
- [ ] Dashboard shows device-specific metrics
- [ ] API endpoints support device filtering
- [ ] Database stores device type correctly

## 📁 Files to Modify

### Backend Files
```
shared/schema.ts
server/scanning/scan-engine.ts
server/scanning/web-crawler.ts
server/scanning/lighthouse-scanner.ts
server/routes.ts
server/storage.ts
```

### Frontend Files
```
client/src/components/ui/device-toggle.tsx (new)
client/src/pages/dashboard.tsx
client/src/pages/bug-reports.tsx
client/src/pages/performance.tsx
client/src/pages/monitoring.tsx
client/src/pages/alerts.tsx
```

## 🚀 Implementation Order

### Day 1: Foundation
1. Database schema updates
2. Backend TypeScript interfaces
3. Scan engine modifications
4. Web crawler mobile support

### Day 2: Core Functionality
1. Lighthouse mobile configuration
2. API route updates
3. Device toggle component
4. Basic frontend integration

### Day 3: UI Integration
1. Update all pages with device toggle
2. Test device switching
3. Validate data filtering
4. Performance optimization

## ⚠️ Considerations

### Performance Impact
- **Scan Time**: Will increase (2x scans per run)
- **Storage**: More database space needed
- **Processing**: Higher CPU usage for dual scans

### User Experience
- **Default Device**: Start with desktop as default
- **Toggle Placement**: Consistent location across pages
- **Loading States**: Handle device switching gracefully

### Backward Compatibility
- **Existing Data**: Mark as desktop by default
- **API Changes**: Maintain backward compatibility
- **Migration**: Smooth transition for existing users

## 📈 Success Metrics

### Technical Metrics
- [ ] Both device types scan successfully
- [ ] Toggle switches data correctly
- [ ] No performance degradation
- [ ] All pages support device filtering

### Business Metrics
- [ ] Improved mobile insights
- [ ] Better user engagement
- [ ] Enhanced monitoring value
- [ ] Competitive differentiation

## 🔮 Future Enhancements

### Phase 2 Features
- **Device Comparison**: Side-by-side mobile vs desktop
- **Mobile-Specific Alerts**: Separate thresholds for mobile
- **Responsive Analysis**: Detect responsive design issues
- **Device Analytics**: Track device usage patterns

### Advanced Features
- **Tablet Support**: Add tablet device type
- **Custom Viewports**: User-defined device sizes
- **Device-Specific Reports**: Separate reports per device
- **Performance Trends**: Device-specific performance tracking

## 📝 Notes

- **Uptime Monitoring**: Remains device-agnostic (server availability)
- **Alert Settings**: May need device-specific thresholds
- **Scan Scheduling**: Consider separate schedules for mobile/desktop
- **Data Retention**: Plan for increased storage requirements

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 2-3 days
**Dependencies**: None (self-contained feature) 