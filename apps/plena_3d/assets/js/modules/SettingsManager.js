class SettingsManager {
    save(e) {
        if (e) e.preventDefault();
        DB.data.settings.watts = parseFloat(_('conf-watts').value);
        DB.data.settings.kwh = parseFloat(_('conf-kwh').value);
        DB.data.settings.depreciation = parseFloat(_('conf-depreciation').value);
        DB.data.settings.failure = parseFloat(_('conf-failure').value);
        DB.data.settings.storeName = _('conf-store-name').value;
        DB.data.settings.storeDoc = _('conf-store-doc').value;
        DB.save();
        alert('Configurações salvas!');
    }
}
