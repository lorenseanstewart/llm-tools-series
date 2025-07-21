import { validate } from 'class-validator';
import { ChatRequestDto } from './chat-request.dto';

describe('ChatRequestDto', () => {
  describe('validation', () => {
    it('should pass validation with valid userMessage', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 'Find me some listings in Portland';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty userMessage', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userMessage');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with undefined userMessage', async () => {
      const dto = new ChatRequestDto();
      // userMessage is undefined

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userMessage');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with null userMessage', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = null as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userMessage');
    });

    it('should fail validation with non-string userMessage', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userMessage');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with long userMessage', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 'a'.repeat(1000);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with special characters', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 'Find listings with $500,000 budget & 3+ bedrooms!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with unicode characters', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 'Find properties in San José, California 🏠';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with whitespace-only userMessage', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = '   ';

      // Note: This might be debatable - whitespace-only messages might
      // not be useful, but class-validator's @IsNotEmpty allows whitespace
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with newlines and tabs', async () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 'Find listings\nin Portland\t with 3 bedrooms';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle real estate specific terminology', async () => {
      const realEstateTerms = [
        'Find active listings in Portland, OR',
        'Show me 3-bedroom houses under $800,000',
        'Send a report to client@example.com',
        'Properties with 2+ bathrooms and parking',
        'MLS listings in the downtown area'
      ];

      for (const message of realEstateTerms) {
        const dto = new ChatRequestDto();
        dto.userMessage = message;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('constructor and properties', () => {
    it('should create instance with default values', () => {
      const dto = new ChatRequestDto();
      expect(dto).toBeDefined();
      expect(dto.userMessage).toBeUndefined();
    });

    it('should allow setting userMessage property', () => {
      const dto = new ChatRequestDto();
      const message = 'Test message';
      dto.userMessage = message;

      expect(dto.userMessage).toBe(message);
    });

    it('should be serializable to JSON', () => {
      const dto = new ChatRequestDto();
      dto.userMessage = 'Test message';

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.userMessage).toBe('Test message');
    });

    it('should be deserializable from JSON', () => {
      const json = '{"userMessage": "Test message"}';
      const parsed = JSON.parse(json);
      
      const dto = new ChatRequestDto();
      Object.assign(dto, parsed);

      expect(dto.userMessage).toBe('Test message');
    });
  });
});