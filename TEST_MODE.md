# Test Mode Configuration

## Overview
Test mode allows you to scan a test website instead of your actual Shopify store. This is useful for testing the scanning functionality without affecting your real store.

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Enable test mode (true/false)
TEST_MODE=true

# Test website URL (optional, defaults to https://creativesproutmedia.com/)
TEST_WEBSITE=https://creativesproutmedia.com/
```

### Test Mode Behavior

When `TEST_MODE=true`:
- ✅ All scans (manual and scheduled) will scan the test website
- ✅ Original store URL is preserved in logs for reference
- ✅ Test mode indicator appears on dashboard
- ✅ Scan results are still saved to your store's database
- ✅ Email/Slack notifications still work

When `TEST_MODE=false` (or not set):
- ✅ All scans target your actual Shopify store
- ✅ Normal behavior restored

## Usage Examples

### Enable Test Mode
```env
TEST_MODE=true
TEST_WEBSITE=https://creativesproutmedia.com/
```

### Disable Test Mode
```env
TEST_MODE=false
# or remove TEST_MODE from .env
```

### Use Different Test Website
```env
TEST_MODE=true
TEST_WEBSITE=https://example.com/
```

## Visual Indicators

When test mode is enabled, you'll see:
- 🧪 Test mode badge on the dashboard
- Console logs showing test mode is active
- Original vs test URLs in scan logs

## Benefits

1. **Safe Testing**: Test scanning without affecting your store
2. **Development**: Perfect for development and debugging
3. **Demo**: Show scanning functionality to clients
4. **Training**: Train team members safely

## Notes

- Test mode only affects the scanning URL
- All other functionality (notifications, database, etc.) remains the same
- Scan results are still associated with your store ID
- Perfect for testing with public websites like [Creative Sprout Media](https://creativesproutmedia.com/) 