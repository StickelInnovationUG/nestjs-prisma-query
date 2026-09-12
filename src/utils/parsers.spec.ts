import { parseOrderBy } from './parsers';

describe('Parsers', () => {
  describe('parseOrderBy', () => {
    it('should parse simple order by strings', () => {
      const result = parseOrderBy('createdAt:desc');
      expect(result).toEqual([{ createdAt: 'desc' }]);
    });

    it('should parse comma-separated order by strings', () => {
      const result = parseOrderBy('createdAt:desc,id:asc');
      expect(result).toEqual([{ createdAt: 'desc' }, { id: 'asc' }]);
    });

    it('should handle nested dot notation', () => {
      const result = parseOrderBy('user.name:asc');
      expect(result).toEqual([{ user: { name: 'asc' } }]);
    });

    it('should handle deeply nested dot notation', () => {
      const result = parseOrderBy('a.b.c:desc');
      expect(result).toEqual([{ a: { b: { c: 'desc' } } }]);
    });

    it('should ignore invalid formats', () => {
      const result = parseOrderBy('invalid');
      expect(result).toEqual([]);
    });
  });
});
