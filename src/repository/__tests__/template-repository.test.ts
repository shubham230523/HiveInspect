import { saveTemplate, getTemplates } from '../template-repository';
import { supabase } from '../../services/supabase';

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
  },
}));

describe('Template Repository', () => {
  test('getTemplates should call supabase', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    await getTemplates();
    expect(supabase.from).toHaveBeenCalledWith('templates');
  });

  test('saveTemplate should call supabase rpc', async () => {
    const mockTemplate: any = {
      id: '1',
      name: 'Test',
      source: 'Spectora',
      sections: [],
    };

    (supabase.rpc as jest.Mock).mockResolvedValue({ data: {}, error: null });

    const result = await saveTemplate(mockTemplate);
    expect(result.error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('import_template_hierarchy', expect.any(Object));
  });
});
