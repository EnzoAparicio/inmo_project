import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-blue-600">Syncalo</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          14 días de prueba gratis · Sin tarjeta de crédito
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          La plataforma para{" "}
          <span className="text-blue-600">agencias inmobiliarias</span>{" "}
          modernas
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Gestioná propiedades, inquilinos y contratos. Sincronizá calendarios de Airbnb y Booking.
          Todo en un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition text-lg"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition text-lg"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>

      {/* Feature blocks */}
      <section className="max-w-5xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Inmobiliaria */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 border border-blue-200">
            <div className="text-3xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Gestión inmobiliaria</h2>
            <p className="text-gray-600 text-sm mb-5">
              Control total de tu cartera de propiedades de alquiler tradicional.
            </p>
            <ul className="space-y-2">
              {[
                "Inquilinos con datos de contacto y documento",
                "Contratos con fechas, renta y depósito",
                "Cobros mensuales con estado de pago",
                "Alertas de pagos atrasados",
                "Recordatorios por email al inquilino",
                "Exportación de pagos a CSV",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Airbnb/Booking */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-8 border border-orange-200">
            <div className="text-3xl mb-4">📅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Sync de calendarios</h2>
            <p className="text-gray-600 text-sm mb-5">
              Sincronizá todos tus canales de alquiler temporario sin esfuerzo.
            </p>
            <ul className="space-y-2">
              {[
                "Conexión con Airbnb, Booking.com y canal directo",
                "Sincronización automática cada hora",
                "Detección de reservas superpuestas",
                "Alertas de conflictos por email",
                "Vista de calendario mensual unificada",
                "Historial de reservas por propiedad",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-rose-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: "👥",
              title: "Multi-usuario",
              desc: "Invitá a tu equipo con roles de Administrador, Agente o Visualizador.",
            },
            {
              icon: "📊",
              title: "Dashboard de gestión",
              desc: "Resumen de contratos activos, cobros del mes y pagos atrasados en tiempo real.",
            },
            {
              icon: "🔒",
              title: "Seguro y confiable",
              desc: "Base de datos en la nube, backups automáticos y acceso protegido con contraseña.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Planes simples y transparentes
        </h2>
        <p className="text-center text-gray-500 mb-12">Todos los planes incluyen gestión inmobiliaria y sync de calendarios.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "0",
              desc: "Para empezar",
              features: [
                "1 propiedad",
                "2 canales por propiedad",
                "Sync manual",
                "Gestión de contratos",
              ],
              cta: "Empezar gratis",
              highlight: false,
            },
            {
              name: "Starter",
              price: "9",
              desc: "Para agencias en crecimiento",
              features: [
                "Hasta 5 propiedades",
                "Sync automático cada hora",
                "Alertas de conflictos",
                "Recordatorios de pago",
                "Exportación CSV",
              ],
              cta: "Probar 14 días gratis",
              highlight: true,
            },
            {
              name: "Pro",
              price: "29",
              desc: "Para gestores profesionales",
              features: [
                "Propiedades ilimitadas",
                "Sync automático cada hora",
                "Multi-usuario ilimitado",
                "Soporte prioritario",
                "Todo de Starter",
              ],
              cta: "Probar 14 días gratis",
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border ${
                plan.highlight
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-4 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>
                {plan.desc}
              </p>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  ${plan.price}
                </span>
                <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                  /mes
                </span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className={`text-sm flex items-start gap-2 ${plan.highlight ? "text-blue-50" : "text-gray-600"}`}>
                    <span className={plan.highlight ? "text-blue-200" : "text-blue-600"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-8 py-16 text-center">
        <div className="bg-blue-600 rounded-3xl p-10 text-white">
          <h2 className="text-3xl font-bold mb-3">Empezá hoy, gratis</h2>
          <p className="text-blue-100 mb-6">
            14 días de prueba sin tarjeta de crédito. Cancelá cuando quieras.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Syncalo · Todos los derechos reservados
      </footer>
    </div>
  );
}
