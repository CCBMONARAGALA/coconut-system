src/components/modals/AddNotificationModal.tsx:      fetchSettings();
src/components/modals/AddNotificationModal.tsx:  const fetchSettings = async () => {
src/components/modals/AddNotificationModal.tsx:        fetch('/api/cdo-divisions'),
src/components/modals/AddNotificationModal.tsx:        fetch('/api/gn-divisions'),
src/components/modals/AddNotificationModal.tsx:        fetch('/api/programs'),
src/components/modals/AddNotificationModal.tsx:        fetch('/api/other-nurseries-list'),
src/components/modals/AddNotificationModal.tsx:        fetch('/api/journal-prices')
src/components/modals/AddNotificationModal.tsx:      console.error('Failed to fetch settings');
src/components/modals/AddNotificationModal.tsx:      const response = await fetch('/api/notifications', {
src/components/modals/UpdateIssuanceModal.tsx:      const response = await fetch(`/api/notifications/${searchNo}`);
src/components/modals/UpdateIssuanceModal.tsx:      const response = await fetch(`/api/notifications/${selectedNotification.id}/issue`, {
src/components/modals/UpdateReceiptModal.tsx:      const response = await fetch(`/api/notifications/${searchNo}`);
src/components/modals/UpdateReceiptModal.tsx:      const response = await fetch(`/api/notifications/${selectedNotification.id}/receipts`, {
src/components/Reports.tsx:    const fetchAll = async () => {
src/components/Reports.tsx:        const response = await fetch(url);
src/components/Reports.tsx:        console.error('Failed to fetch report data');
src/components/Reports.tsx:    fetchAll();
src/components/Settings.tsx:  const fetchData = async () => {
src/components/Settings.tsx:        fetch('/api/cdo-divisions').then(r => r.json()),
src/components/Settings.tsx:        fetch('/api/gn-divisions').then(r => r.json()),
src/components/Settings.tsx:        fetch('/api/programs').then(r => r.json()),
src/components/Settings.tsx:        fetch('/api/other-nurseries-list').then(r => r.json()),
src/components/Settings.tsx:        fetch('/api/journal-prices').then(r => r.json())
src/components/Settings.tsx:      console.error('Failed to fetch settings data');
src/components/Settings.tsx:    fetchData();
src/components/Settings.tsx:      const res = await fetch(endpoint, {
src/components/Settings.tsx:        fetchData();
src/components/Settings.tsx:      await fetch(endpoint, { method: 'DELETE' });
src/components/Settings.tsx:      fetchData();
src/components/NurseryDashboard.tsx:  const fetchNotifications = async () => {
src/components/NurseryDashboard.tsx:      const response = await fetch(`/api/notifications?nursery_name=${encodeURIComponent(user.nursery_name || '')}`);
src/components/NurseryDashboard.tsx:      console.error('Failed to fetch notifications');
src/components/NurseryDashboard.tsx:    fetchNotifications();
src/components/NurseryDashboard.tsx:        onSuccess={fetchNotifications}
src/components/Login.tsx:      const response = await fetch('/api/login', {
src/components/AdminDashboard.tsx:  const fetchNotifications = async () => {
src/components/AdminDashboard.tsx:      const response = await fetch(`/api/notifications?nursery_type=${type}`);
src/components/AdminDashboard.tsx:      console.error('Failed to fetch notifications');
src/components/AdminDashboard.tsx:    fetchNotifications();
src/components/AdminDashboard.tsx:        onSuccess={fetchNotifications}
src/components/AdminDashboard.tsx:        onSuccess={fetchNotifications}
