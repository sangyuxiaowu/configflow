export type Language = 'zh' | 'en';

export interface TranslationDictionary {
  // Common / General
  common: {
    appName: string;
    appSubtitle: string;
    footerTitle: string;
    footerSubtitle1: string;
    footerSubtitle2: string;
    footerSubtitle3: string;
    confirm: string;
    cancel: string;
    close: string;
    save: string;
    delete: string;
    edit: string;
    copy: string;
    copied: string;
    download: string;
    upload: string;
    search: string;
    reset: string;
    retry: string;
    back: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    loading: string;
    all: string;
    required: string;
    optional: string;
    default: string;
    current: string;
    baseline: string;
    actions: string;
    status: string;
    version: string;
    author: string;
    updatedAt: string;
    itemCount: string;
    noData: string;
  };

  // Navigation & Top Bar
  nav: {
    opsMode: string;
    devMode: string;
    resetWorkspace: string;
    resetWorkspaceTitle: string;
    loadDemo: string;
    language: string;
    switchLanguage: string;
    zh: string;
    en: string;
  };

  // Remote loading
  remote: {
    loadingTitle: string;
    loadingDesc: string;
    targetUrl: string;
    loadFailedTitle: string;
    requestUrl: string;
    retryButton: string;
    manualImportButton: string;
    loadDemoButton: string;
    proxyFailed: string;
    notStandardJsonObject: string;
    loadSuccessStandard: string;
    loadSuccessInferred: string;
    loadFailedToast: string;
  };

  // Workspace Actions & Toasts
  workspace: {
    demoLoaded: string;
    clearedState: string;
    schemaLoadedStandard: string;
    schemaLoadedInferred: string;
    currentConfigLoaded: string;
  };

  // Ops Visual Editor
  ops: {
    specTitle: string;
    complianceValidating: string;
    allPassed: string;
    hasErrors: string;
    changesTitle: string;
    modifiedCount: string;
    noChanges: string;
    resetAllChanges: string;
    loadCurrentConfig: string;
    loadSchemaSpec: string;
    refBaseline: string;
    validateAndExport: string;
    allCategories: string;
    searchPlaceholder: string;
    filterAll: string;
    filterModified: string;
    filterErrors: string;
    filterDangerous: string;
    noSchemaEmptyTitle: string;
    noSchemaEmptyDesc: string;
    btnImportDevSchema: string;
    btnLoadShowcase: string;
    btnCreateInDev: string;
    noMatchFields: string;
    resetFilter: string;
    diffWithOriginal: string;
    originalValue: string;
    baselineValue: string;
    resetToBaseline: string;
    resetToDefault: string;
    modifiedTag: string;
    criticalAlert: string;
    restartRequired: string;
    sensitiveField: string;
    devNotes: string;
    addItem: string;
    removeItem: string;
    moveUp: string;
    moveDown: string;
    cloneItem: string;
    collapseAll: string;
    expandAll: string;
    fieldCountBadge: string;
    quickFill: string;
    togglePasswordVisibility: string;
  };

  // Reference Drawer
  refDrawer: {
    title: string;
    subtitle: string;
    noExamples: string;
    applyProfile: string;
    appliedSuccess: string;
    diffWithCurrent: string;
    identical: string;
    architectNotes: string;
    recommendedHardware: string;
    activeBaseline: string;
    selectToCompare: string;
  };

  // Ops Export Modal
  opsExport: {
    title: string;
    subtitle: string;
    passedBadge: string;
    passedDesc: string;
    failedBadge: string;
    failedDesc: string;
    exportJsonFilename: string;
    minifyJson: string;
    prettyJson: string;
    downloadBtn: string;
    copyBtn: string;
    copiedSuccess: string;
    downloadedSuccess: string;
    errorListTitle: string;
    viewInWorkbench: string;
  };

  // Load Current Config Modal
  loadConfigModal: {
    title: string;
    subtitle: string;
    tabFile: string;
    tabPaste: string;
    tabRemote: string;
    dragDropText: string;
    browseFile: string;
    fileLoaded: string;
    pasteLabel: string;
    pastePlaceholder: string;
    fetchBtn: string;
    fetching: string;
    parseSuccess: string;
    parseFailed: string;
    matchFieldsCount: string;
    applyButton: string;
  };

  // Config Load Modal (Schema & Raw)
  schemaLoadModal: {
    title: string;
    subtitle: string;
    tabUpload: string;
    tabPaste: string;
    tabRemote: string;
    tabPresets: string;
    dragSchemaText: string;
    pasteSchemaLabel: string;
    pasteSchemaPlaceholder: string;
    remoteSchemaLabel: string;
    remoteSchemaPlaceholder: string;
    presetListTitle: string;
    usePresetBtn: string;
    confirmBtn: string;
    autoDetectNotice: string;
  };

  // Dev Schema Designer
  dev: {
    title: string;
    subtitle: string;
    createBlankSchema: string;
    importJson: string;
    exportPackage: string;
    referenceProfiles: string;
    previewOpsWorkbench: string;
    editBasicInfo: string;
    categoriesTitle: string;
    addCategory: string;
    allFields: string;
    searchFieldPlaceholder: string;
    addFieldBtn: string;
    emptyFieldsTitle: string;
    emptyFieldsDesc: string;
    noSchemaTitle: string;
    noSchemaDesc: string;
    startFromScratch: string;
    schemaName: string;
    schemaVersion: string;
    schemaAuthor: string;
    schemaDesc: string;
    confirmCreate: string;
  };

  // Field Editor
  fieldEditor: {
    editTitle: string;
    newTitle: string;
    basicSettings: string;
    fieldKey: string;
    fieldKeyDesc: string;
    fieldLabel: string;
    fieldLabelDesc: string;
    fieldType: string;
    category: string;
    description: string;
    defaultValue: string;
    requiredRule: string;
    sensitiveRule: string;
    dangerousRule: string;
    restartRule: string;
    constraintsTitle: string;
    minMaxRange: string;
    unit: string;
    enumOptions: string;
    addOption: string;
    regexPattern: string;
    regexDesc: string;
    itemFieldsTitle: string;
    itemTitleKey: string;
  };

  // PWA & Offline
  pwa: {
    installApp: string;
    installAppTitle: string;
    installMobile: string;
    pwaSupport: string;
    iosInstallTitle: string;
    iosStep1: string;
    iosStep2: string;
    iosStep3: string;
    gotIt: string;
    desktopGuideTitle: string;
    desktopGuideDesc: string;
    howToInstall: string;
    howToInstallDesc: string;
    pwaFeatures: string;
    offlineModeNotice: string;
  };

  // Validation messages
  validation: {
    requiredField: string;
    atLeastOneItem: string;
    minItems: string;
    maxItems: string;
    portRange: string;
    numberMin: string;
    numberMax: string;
    stringMinLength: string;
    stringMaxLength: string;
    invalidIp: string;
    invalidUrl: string;
    patternMismatch: string;
    enumMismatch: string;
  };
}
