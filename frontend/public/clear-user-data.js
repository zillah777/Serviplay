// Script para limpiar datos de usuario obsoletos del navegador
// Ejecutar en la consola del navegador antes de hacer login después de las actualizaciones

console.log('🧹 Limpiando datos de usuario obsoletos...');

// Limpiar localStorage
localStorage.removeItem('user');
localStorage.removeItem('user_profiles'); 
localStorage.removeItem('auth_token');
localStorage.removeItem('refresh_token');

// Limpiar sessionStorage por si acaso
sessionStorage.removeItem('user');
sessionStorage.removeItem('user_profiles');
sessionStorage.removeItem('auth_token');
sessionStorage.removeItem('refresh_token');

console.log('✅ Datos limpiados. Ya puedes hacer login con datos frescos.');
console.log('📝 El sistema ahora obtiene información directamente del backend.');