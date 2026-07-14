import { settingsStore } from '../store/settingsStore';

export const translations = {
  es: {
    // Layout & Navigation
    navDashboard: 'Dashboard',
    navTasks: 'Tareas',
    navProjects: 'Proyectos',
    navHistory: 'Historial',
    navAnalytics: 'Analíticas',
    navSettings: 'Configuración',
    logout: 'Cerrar Sesión',
    proBadge: 'Pro',
    active: 'Activo',
    free: 'Gratuito',

    // Dashboard
    dashTitle: 'Resumen de Rendimiento',
    dashSubtitle: 'Medición inteligente del tiempo real de tus actividades',
    kpiToday: 'Hoy',
    kpiWeek: 'Esta Semana',
    kpiBreaks: 'Descansos',
    kpiProgress: 'Progreso Diario',
    recentActivity: 'Actividad Reciente',
    emptyActivity: 'No has registrado actividades hoy.',
    startTimer: 'Iniciar',
    actionTimer: 'Cronometrar',

    // Tasks Page
    tasksTitle: 'Tus Tareas Repetitivas',
    tasksSubtitle: 'Mide el tiempo real de tus actividades recurrentes',
    newTaskBtn: 'Nueva Tarea',
    taskAverage: 'Promedio Ponderado',
    taskMin: 'Mínimo',
    taskMax: 'Máximo',
    taskConfidence: 'Confianza',
    confidenceHigh: 'Alta',
    confidenceMedium: 'Media',
    confidenceLow: 'Baja',
    taskNoTasks: 'Aún no has creado ninguna tarea. Haz clic en "Nueva Tarea" para empezar.',
    
    // Projects Page
    projectsTitle: 'Tus Proyectos',
    projectsSubtitle: 'Planifica estimaciones de tiempos basadas en tareas reales',
    newProjectBtn: 'Crear Proyecto',
    projectEstimate: 'Estimado',
    projectWorked: 'Trabajado',
    projectRemaining: 'Restante',
    projectProgress: 'Progreso de Tareas',
    projectPlanBtn: 'Planificar / Ejecutar',
    projectNoProjects: 'Aún no has creado ningún proyecto. Haz clic en "Crear Proyecto" para comenzar.',

    // Project Detail Page
    projBack: 'Volver a Proyectos',
    projPlannerTitle: 'Planificador de Tareas',
    projPlannerSubtitle: 'Arrastra y ordena las tareas. Al reordenar, se autocalculan los tiempos restantes.',
    projNotesTitle: 'Notas del Proyecto',
    projNotesEmpty: 'Sin anotaciones adicionales.',
    projAddTasksBtn: 'Agregar Tareas',

    // History Page
    historyTitle: 'Historial de Tiempos',
    historySubtitle: 'Consulta y gestiona las sesiones de tiempo registradas',
    exportCsv: 'Exportar a CSV',
    searchPlaceholder: 'Buscar por nombre de tarea u observaciones...',
    allCategories: 'Todas las Categorías',
    tableDate: 'Fecha',
    tableTask: 'Tarea',
    tableProject: 'Proyecto',
    tableDuration: 'Duración',
    tableNotes: 'Observaciones',
    tableActions: 'Acciones',
    noLogs: 'No se encontraron registros de tiempo.',

    // Analytics Page
    analyticsTitle: 'Analíticas de Productividad',
    analyticsSubtitle: 'Reporte detallado sobre promedios matemáticos y eficiencias',
    statMedian: 'Mediana Histórica',
    statMode: 'Moda de Duración',
    statDaysActive: 'días activos',
    chartTrend: 'Horas Trabajadas por Día',
    chartTrendSub: 'Historial acumulativo de tus últimas jornadas',
    chartRatio: 'Ratio de Productividad',
    chartRatioSub: 'Comparación de trabajo vs pausas en los últimos 30 días',
    rankTasks: 'Ranking de Tareas',
    rankProjects: 'Ranking de Proyectos',

    // Settings Page
    settingsTitle: 'Configuración',
    settingsSubtitle: 'Administra tus preferencias de interfaz y tu suscripción SaaS',
    billingPlan: 'Plan de Suscripción',
    billingProDesc: 'Tienes acceso ilimitado a proyectos, tareas y estimaciones inteligentes basadas en el promedio móvil ponderado.',
    billingFreeDesc: 'Suscripción gratuita. Estás limitado a un máximo de 3 proyectos activos y 15 tareas en total.',
    billingPortalBtn: 'Administrar Facturación',
    billingUpgradeBtn: 'Upgrade a Pro ($9/mes)',
    uiPreferences: 'Preferencias de Interfaz',
    uiPreferencesSub: 'Personaliza la apariencia general de la aplicación',
    settingTheme: 'Tema Visual',
    settingThemeSub: 'Toggle claro u oscuro',
    settingThemeBtnDark: 'Cambiar a Modo Claro',
    settingThemeBtnLight: 'Cambiar a Modo Oscuro',
    settingSound: 'Alertas de Sonido',
    settingSoundSub: 'Sonidos al terminar cronómetros',
    settingSoundOn: 'Activados',
    settingSoundOff: 'Desactivados',
    settingLang: 'Idioma de la Plataforma',
    settingLangSub: 'Configuración de traducción global',
  },
  en: {
    // Layout & Navigation
    navDashboard: 'Dashboard',
    navTasks: 'Tasks',
    navProjects: 'Projects',
    navHistory: 'History',
    navAnalytics: 'Analytics',
    navSettings: 'Settings',
    logout: 'Log Out',
    proBadge: 'Pro',
    active: 'Active',
    free: 'Free',

    // Dashboard
    dashTitle: 'Performance Summary',
    dashSubtitle: 'Smart time measurement of your actual activities',
    kpiToday: 'Today',
    kpiWeek: 'This Week',
    kpiBreaks: 'Breaks',
    kpiProgress: 'Daily Progress',
    recentActivity: 'Recent Activity',
    emptyActivity: 'No recorded activities today.',
    startTimer: 'Start',
    actionTimer: 'Track Time',

    // Tasks Page
    tasksTitle: 'Your Repetitive Tasks',
    tasksSubtitle: 'Measure actual time of your recurring activities',
    newTaskBtn: 'New Task',
    taskAverage: 'Weighted Average',
    taskMin: 'Minimum',
    taskMax: 'Maximum',
    taskConfidence: 'Confidence',
    confidenceHigh: 'High',
    confidenceMedium: 'Medium',
    confidenceLow: 'Low',
    taskNoTasks: 'You have not created any tasks yet. Click "New Task" to get started.',

    // Projects Page
    projectsTitle: 'Your Projects',
    projectsSubtitle: 'Plan estimated timelines based on real tasks',
    newProjectBtn: 'Create Project',
    projectEstimate: 'Estimated',
    projectWorked: 'Worked',
    projectRemaining: 'Remaining',
    projectProgress: 'Task Progress',
    projectPlanBtn: 'Plan / Execute',
    projectNoProjects: 'You have not created any projects yet. Click "Create Project" to get started.',

    // Project Detail Page
    projBack: 'Back to Projects',
    projPlannerTitle: 'Task Planner',
    projPlannerSubtitle: 'Drag and reorder tasks. Reordering automatically recalculates remaining time.',
    projNotesTitle: 'Project Notes',
    projNotesEmpty: 'No additional notes.',
    projAddTasksBtn: 'Add Tasks',

    // History Page
    historyTitle: 'Time Logs History',
    historySubtitle: 'Query and manage your recorded time sessions',
    exportCsv: 'Export to CSV',
    searchPlaceholder: 'Search by task name or observations...',
    allCategories: 'All Categories',
    tableDate: 'Date',
    tableTask: 'Task',
    tableProject: 'Project',
    tableDuration: 'Duration',
    tableNotes: 'Observations',
    tableActions: 'Actions',
    noLogs: 'No recorded time sessions found.',

    // Analytics Page
    analyticsTitle: 'Productivity Analytics',
    analyticsSubtitle: 'Detailed report on mathematical averages and efficiencies',
    statMedian: 'Historical Median',
    statMode: 'Duration Mode',
    statDaysActive: 'active days',
    chartTrend: 'Worked Hours Per Day',
    chartTrendSub: 'Accumulated history of your latest work days',
    chartRatio: 'Productivity Ratio',
    chartRatioSub: 'Active work vs breaks comparison over the last 30 days',
    rankTasks: 'Task Rankings',
    rankProjects: 'Project Rankings',

    // Settings Page
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage your layout preferences and SaaS subscription',
    billingPlan: 'Subscription Plan',
    billingProDesc: 'You have unlimited access to projects, tasks and smart estimations based on weighted moving averages.',
    billingFreeDesc: 'Free subscription. Limited to 3 active projects and 15 total tasks.',
    billingPortalBtn: 'Manage Billing',
    billingUpgradeBtn: 'Upgrade to Pro ($9/mo)',
    uiPreferences: 'Interface Preferences',
    uiPreferencesSub: 'Customize the overall look of the application',
    settingTheme: 'Visual Theme',
    settingThemeSub: 'Toggle light or dark theme',
    settingThemeBtnDark: 'Switch to Light Mode',
    settingThemeBtnLight: 'Switch to Dark Mode',
    settingSound: 'Sound Alerts',
    settingSoundSub: 'Trigger notification sounds when timers complete',
    settingSoundOn: 'Enabled',
    settingSoundOff: 'Disabled',
    settingLang: 'Platform Language',
    settingLangSub: 'Global translations configuration',
  },
};

export const useTranslation = () => {
  const { settings } = settingsStore();
  const lang = settings.language || 'es';
  const t = (key: keyof typeof translations.es) => {
    return translations[lang][key] || translations.es[key] || key;
  };
  return { t, lang };
};
