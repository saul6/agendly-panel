import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio — Agendly",
  description:
    "Conoce los términos y condiciones del servicio Agendly (DuoMind Solutions), incluyendo planes, precios y uso aceptable.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#7C3AED] font-bold text-xl">
            <span>✦</span>
            <span>Agendly</span>
          </Link>
          <span className="text-sm text-gray-500">Términos de Servicio</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos de Servicio</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: abril de 2026</p>

        <div className="space-y-10 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">1. Descripción del servicio</h2>
            <p>
              <strong>Agendly</strong> es una plataforma de software como servicio (SaaS) desarrollada por{" "}
              <strong>DuoMind Solutions</strong>, con domicilio en Zamora, Michoacán, México. Agendly
              permite a pequeños negocios (barberías, salones de belleza, consultorios, restaurantes y
              similares) recibir, gestionar y confirmar citas de sus clientes directamente a través de
              WhatsApp, sin que el cliente final necesite descargar ninguna aplicación adicional.
            </p>
            <p className="mt-3">
              El servicio incluye un bot conversacional conectado a la{" "}
              <strong>Meta WhatsApp Cloud API</strong>, un panel de administración web y, opcionalmente,
              un módulo de cobro integrado.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">2. Aceptación de los términos</h2>
            <p>
              Al registrarte en Agendly, acceder al panel de administración o utilizar cualquier
              componente del servicio, aceptas íntegramente los presentes Términos de Servicio. Si no
              estás de acuerdo con alguno de ellos, debes abstenerte de utilizar el servicio.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">3. Planes y precios</h2>
            <p>
              Agendly ofrece los siguientes planes de suscripción mensual. Todos los precios incluyen IVA
              y están expresados en pesos mexicanos (MXN):
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#7C3AED] text-white">
                    <th className="text-left px-4 py-3 rounded-tl-lg">Plan</th>
                    <th className="text-left px-4 py-3">Precio / mes</th>
                    <th className="text-left px-4 py-3 rounded-tr-lg">Características principales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">Básico</td>
                    <td className="px-4 py-3">$347 MXN</td>
                    <td className="px-4 py-3">1 sucursal, 1 empleado, agendamiento WhatsApp, recordatorios</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Pro</td>
                    <td className="px-4 py-3">$695 MXN</td>
                    <td className="px-4 py-3">1 sucursal, hasta 5 empleados, cobro integrado, reportes</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">Negocio</td>
                    <td className="px-4 py-3">$1,159 MXN</td>
                    <td className="px-4 py-3">Multi-sucursal, empleados ilimitados, IA avanzada, soporte prioritario</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-gray-600 text-sm">
              DuoMind Solutions se reserva el derecho de modificar los precios con un aviso previo de al
              menos <strong>30 días naturales</strong> mediante notificación al correo registrado o a
              través del panel de administración.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">4. Obligaciones del usuario (negocio)</h2>
            <p>Como negocio suscriptor de Agendly te comprometes a:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>
                Proporcionar información veraz y actualizada al momento del registro y durante la
                vigencia de la suscripción.
              </li>
              <li>
                Usar el servicio de forma lícita, respetando la legislación mexicana vigente y las
                Políticas de Uso de Meta para WhatsApp Business.
              </li>
              <li>
                Obtener el consentimiento de tus clientes para comunicarte con ellos a través de
                WhatsApp usando Agendly.
              </li>
              <li>
                Mantener la confidencialidad de tus credenciales de acceso al panel de administración.
              </li>
              <li>
                Pagar puntualmente la suscripción en la fecha acordada para mantener el servicio activo.
              </li>
              <li>
                No recomercializar, sublicenciar ni ceder el acceso a Agendly a terceros sin autorización
                expresa de DuoMind Solutions.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">5. Uso aceptable del bot de WhatsApp</h2>
            <p>
              El bot de Agendly opera bajo las{" "}
              <a
                href="https://www.whatsapp.com/legal/business-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7C3AED] underline"
              >
                Políticas de WhatsApp Business
              </a>{" "}
              de Meta. Está estrictamente <strong>prohibido</strong> utilizar el bot para:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>Enviar mensajes masivos no solicitados (spam).</li>
              <li>Transmitir contenido ilegal, difamatorio, fraudulento o engañoso.</li>
              <li>Acosar, amenazar o discriminar a clientes o terceros.</li>
              <li>
                Suplantar la identidad de otra empresa o persona.
              </li>
              <li>
                Intentar eludir o hackear los sistemas de Agendly, Meta o cualquier proveedor
                tecnológico asociado.
              </li>
              <li>
                Ofrecer productos o servicios prohibidos por la legislación mexicana o las políticas de
                Meta.
              </li>
            </ul>
            <p className="mt-3">
              El incumplimiento de esta sección puede resultar en la suspensión inmediata del servicio y
              en el reporte correspondiente ante Meta.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">6. Disponibilidad del servicio</h2>
            <p>
              DuoMind Solutions procurará que Agendly esté disponible de forma continua; sin embargo, no
              garantiza una disponibilidad del 100%. El servicio puede interrumpirse temporalmente por
              mantenimiento programado, actualizaciones, fallas en proveedores terceros (Meta, Supabase,
              Railway, Vercel) o causas de fuerza mayor.
            </p>
            <p className="mt-3">
              En caso de interrupciones significativas y sostenidas, DuoMind Solutions notificará a los
              negocios afectados y, a su discreción, podrá ofrecer compensaciones en forma de extensión
              del período de suscripción.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">7. Limitación de responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley mexicana, DuoMind Solutions no será responsable
              por:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>
                Pérdidas de negocio, ingresos o datos derivadas de interrupciones del servicio.
              </li>
              <li>
                Errores, omisiones o inexactitudes en los mensajes generados automáticamente por el bot.
              </li>
              <li>
                Daños causados por el uso indebido del servicio por parte del negocio suscriptor o sus
                clientes.
              </li>
              <li>
                Cambios en las políticas de Meta WhatsApp que afecten la funcionalidad del bot.
              </li>
              <li>
                Transacciones de pago procesadas por Conekta o cualquier otro procesador de pagos.
              </li>
            </ul>
            <p className="mt-3">
              La responsabilidad total de DuoMind Solutions frente al suscriptor, en cualquier
              circunstancia, estará limitada al monto pagado por el servicio en los{" "}
              <strong>tres meses anteriores</strong> al evento que originó el daño.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">8. Cancelación de suscripción</h2>
            <p>
              <strong>Por parte del suscriptor:</strong> Puedes cancelar tu suscripción en cualquier
              momento desde el panel de administración o enviando un correo a{" "}
              <a href="mailto:vongolax564@gmail.com" className="text-[#7C3AED] underline">
                vongolax564@gmail.com
              </a>
              . La cancelación tiene efecto al término del período de facturación en curso; no se
              realizan reembolsos prorrateados por el tiempo no utilizado.
            </p>
            <p className="mt-3">
              <strong>Por parte de DuoMind Solutions:</strong> Nos reservamos el derecho de suspender o
              cancelar el acceso al servicio en caso de:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>Incumplimiento de estos Términos de Servicio.</li>
              <li>Falta de pago de la suscripción por más de 7 días naturales.</li>
              <li>Uso del servicio de forma contraria a la ley o a las políticas de Meta.</li>
            </ul>
            <p className="mt-3">
              Tras la cancelación, los datos del negocio se conservarán durante 30 días para permitir su
              exportación, tras lo cual serán eliminados de forma permanente.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">9. Propiedad intelectual</h2>
            <p>
              Todo el software, diseño, marca, logotipos y contenido de Agendly son propiedad exclusiva
              de DuoMind Solutions y están protegidos por las leyes mexicanas e internacionales de
              propiedad intelectual. El suscriptor recibe una licencia de uso limitada, no exclusiva e
              intransferible durante la vigencia de su suscripción.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">10. Privacidad</h2>
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link href="/privacy" className="text-[#7C3AED] underline">
                Política de Privacidad
              </Link>
              , la cual forma parte integrante de estos Términos de Servicio.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">11. Ley aplicable y jurisdicción</h2>
            <p>
              Los presentes Términos de Servicio se rigen e interpretan conforme a las leyes de los{" "}
              <strong>Estados Unidos Mexicanos</strong>. Para cualquier controversia derivada de su
              interpretación o cumplimiento, las partes se someten expresamente a la jurisdicción de los
              tribunales competentes de <strong>Zamora, Michoacán, México</strong>, renunciando a
              cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o
              futuro.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">12. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos de Servicio, comunícate con nosotros:
            </p>
            <address className="mt-3 not-italic text-gray-700 space-y-1">
              <p>
                <strong>DuoMind Solutions</strong>
              </p>
              <p>Zamora, Michoacán, México</p>
              <p>
                Correo:{" "}
                <a href="mailto:vongolax564@gmail.com" className="text-[#7C3AED] underline">
                  vongolax564@gmail.com
                </a>
              </p>
              <p>
                Panel:{" "}
                <a
                  href="https://agendly-panel.vercel.app"
                  className="text-[#7C3AED] underline"
                >
                  agendly-panel.vercel.app
                </a>
              </p>
            </address>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 DuoMind Solutions. Todos los derechos reservados.</p>
          <Link href="/privacy" className="text-[#7C3AED] hover:underline font-medium">
            Ver Política de Privacidad →
          </Link>
        </div>
      </main>
    </div>
  );
}
