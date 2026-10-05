import 'dotenv/config';
import { app } from './app';
import { assertJwtConfigured } from './lib/jwt';

assertJwtConfigured();

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
