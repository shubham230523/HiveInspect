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

  test('saveTemplate should call supabase multiple times', async () => {
    const mockTemplate: any = {
      id: '1',
      name: 'Test',
      source: 'Spectora',
      sections: [
        {
          id: 's1',
          name: 'Section 1',
          order: 0,
          items: [
            {
              id: 'i1',
              name: 'Item 1',
              order: 0,
              comments: [{ id: 'c1', name: 'C1', text: 'T1', order: 0 }],
            },
          ],
        },
      ],
    };

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    });

    const result = await saveTemplate(mockTemplate);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('templates');
    expect(supabase.from).toHaveBeenCalledWith('sections');
    expect(supabase.from).toHaveBeenCalledWith('items');
    expect(supabase.from).toHaveBeenCalledWith('comments');
  });
});
