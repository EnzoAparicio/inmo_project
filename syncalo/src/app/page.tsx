import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-blue-600">Syncalo</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
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
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          14 días de prueba gratis · Sin tarjeta de crédito
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Sincronizá todos tus calendarios{" "}
          <span className="text-blue-600">en un solo lugar</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Conectá Airbnb, Booking.com y tus reservas directas. Evitá dobles
          reservas. Gestioná todas tus propiedades desde un dashboard unificado.
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
            Ver demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🔄",
              title: "Sincronización automática",
              desc: "Tus calendarios se actualizan solos cada hora. Olvidate de copiar y pegar fechas.",
            },
            {
              icon: "⚠️",
              title: "Detección de conflictos",
              desc: "Te avisamos cuando dos plataformas tienen reservas que se superponen en la misma propiedad.",
            },
            {
              icon: "🏠",
              title: "Multi-propiedad",
              desc: "Gestioná todas tus propiedades desde un solo dashboard. Sin límite de propiedades.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Planes simples y transparentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "0",
              desc: "Para empezar",
              features: ["1 propiedad", "2 canales por propiedad", "Sync manual"],
              cta: "Empezar gratis",
              highlight: false,
            },
            {
              name: "Starter",
              price: "9",
              desc: "Para alquiladores activos",
              features: [
                "Hasta 5 propiedades",
                "Sync automático cada hora",
                "Alertas de conflictos",
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
                "Sync en tiempo real",
                "Soporte prioritario",
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
              <h3
                className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-4 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}
              >
                {plan.desc}
              </p>
              <div className="mb-6">
                <span
                  className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}
                >
                  ${plan.price}
                </span>
                <span
                  className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}
                >
                  /mes
                </span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`text-sm flex items-center gap-2 ${plan.highlight ? "text-blue-50" : "text-gray-600"}`}
                  >
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Syncalo · Todos los derechos reservados
      </footer>
    </div>
  );
}
