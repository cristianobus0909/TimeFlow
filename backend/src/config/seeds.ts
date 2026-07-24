import { Category } from '@modules/timer/category.model';
import { logger } from '@config/logger';

export const seedDatabase = async (orgId: string): Promise<void> => {
  try {
    const categoryCount = await Category.countDocuments({ organization: orgId });
    if (categoryCount > 0) {
      logger.info('🌱 Las categorías ya están inicializadas para esta organización.');
      return;
    }

    const defaultCategories = [
      { name: 'Desarrollo', icon: 'Code', color: '#3B82F6', description: 'Desarrollo y codificación de software' },
      { name: 'Administración', icon: 'Briefcase', color: '#10B981', description: 'Tareas administrativas y de oficina' },
      { name: 'Diseño', icon: 'Palette', color: '#EC4899', description: 'Diseño de interfaz, UX y gráfico' },
      { name: 'Marketing', icon: 'Megaphone', color: '#F59E0B', description: 'Campañas publicitarias y marketing digital' },
      { name: 'Capacitación', icon: 'BookOpen', color: '#8B5CF6', description: 'Cursos, aprendizaje y entrenamiento' },
      { name: 'Reuniones', icon: 'Users', color: '#EF4444', description: 'Reuniones con clientes y equipo' },
      { name: 'Consultoría', icon: 'HelpCircle', color: '#06B6D4', description: 'Asesoría y consultoría estratégica' },
      { name: 'Investigación', icon: 'Search', color: '#6366F1', description: 'Investigación de tecnologías y mercado' },
      { name: 'Soporte', icon: 'LifeBuoy', color: '#14B8A6', description: 'Soporte técnico y atención al cliente' },
      { name: 'Testing', icon: 'CheckSquare', color: '#9333EA', description: 'Pruebas de software y aseguramiento de calidad' },
    ];

    const categoriesWithOrg = defaultCategories.map((c) => ({
      ...c,
      organization: orgId,
      active: true,
    }));

    await Category.insertMany(categoriesWithOrg);
    logger.info(`🌱 Semillas de categorías insertadas con éxito para la organización ${orgId}`);
  } catch (error) {
    logger.error('❌ Error al insertar semillas en la base de datos:', error);
  }
};
