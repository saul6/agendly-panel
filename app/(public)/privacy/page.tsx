import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — Agendly",
  description:
    "Conoce cómo Agendly (DuoMind Solutions) recopila, usa y protege tus datos personales conforme a la LFPDPPP.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#7C3AED] font-bold text-xl">
            <span>✦</span>
            <span>Agendly</span>
          </Link>
          <span className="text-sm text-gray-500">Política de Privacidad</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: abril de 2026</p>

        <div className="space-y-10 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">1. Responsable del tratamiento</h2>
            <p>
              <strong>DuoMind Solutions</strong>, con domicilio en Zamora, Michoacán, México, es la empresa
              responsable del tratamiento de tus datos personales. Puedes contactarnos en{" "}
              <a href="mailto:vongolax564@gmail.com" className="text-[#7C3AED] underline">
                vongolax564@gmail.com
              </a>{" "}
              para cualquier asunto relacionado con el presente aviso.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">2. Datos personales que recopilamos</h2>
            <p>Agendly recopila los siguientes datos cuando interactúas con el servicio:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>
                <strong>Nombre completo</strong> — proporcionado voluntariamente durante el proceso de
                agendamiento vía WhatsApp.
              </li>
              <li>
                <strong>Número de teléfono (WhatsApp)</strong> — identificador principal para la
                comunicación a través de la plataforma Meta WhatsApp Cloud API.
              </li>
              <li>
                <strong>Información de citas</strong> — servicio solicitado, fecha, hora, empleado
                asignado y estado del pago.
              </li>
              <li>
                <strong>Historial de conversaciones</strong> — mensajes enviados al bot de Agendly para
                procesar tu solicitud.
              </li>
              <li>
                <strong>Datos de pago</strong> — procesados de forma segura a través de Conekta; Agendly
                no almacena números de tarjeta ni datos bancarios completos.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">3. Finalidad del tratamiento</h2>
            <p>Tus datos personales se utilizan exclusivamente para:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>Procesar y confirmar citas agendadas a través de WhatsApp.</li>
              <li>Enviarte recordatorios de tu cita con anticipación.</li>
              <li>Gestionar el cobro de los servicios cuando el negocio lo requiera.</li>
              <li>Brindar soporte y atender solicitudes de cancelación o reagendamiento.</li>
              <li>Mejorar la experiencia del servicio de forma agregada y anónima.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">4. Tecnologías y terceros que intervienen</h2>
            <p>Para operar el servicio utilizamos las siguientes plataformas de terceros:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>
                <strong>Meta WhatsApp Cloud API</strong> — canal de comunicación. Los mensajes se
                transmiten según las{" "}
                <a
                  href="https://www.whatsapp.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7C3AED] underline"
                >
                  Políticas de Privacidad de Meta
                </a>
                .
              </li>
              <li>
                <strong>Supabase</strong> — almacenamiento de datos en servidores en la región us-east-1
                de Amazon Web Services (AWS). Los datos se cifran en reposo y en tránsito.
              </li>
              <li>
                <strong>Upstash Redis</strong> — caché temporal del estado de conversación con un tiempo
                de vida máximo de 24 horas.
              </li>
              <li>
                <strong>Conekta</strong> — procesamiento de pagos con tarjeta, SPEI y OXXO. Sujeto a la{" "}
                <a
                  href="https://www.conekta.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7C3AED] underline"
                >
                  Política de Privacidad de Conekta
                </a>
                .
              </li>
              <li>
                <strong>Railway / Vercel</strong> — infraestructura de despliegue del servicio.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">5. No venta ni comercialización de datos</h2>
            <p>
              DuoMind Solutions <strong>no vende, arrienda ni comercializa</strong> tus datos personales a
              terceros con fines publicitarios o de mercadotecnia. Los datos únicamente se comparten con
              los proveedores tecnológicos descritos en la sección anterior, en la medida estrictamente
              necesaria para operar el servicio.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">6. Transferencias de datos</h2>
            <p>
              Tus datos pueden ser transferidos a los proveedores tecnológicos mencionados en la sección 4,
              ubicados en los Estados Unidos de América. Al utilizar Agendly aceptas que tus datos sean
              tratados en dichos servidores conforme a las garantías de seguridad que cada proveedor
              ofrece.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">7. Derechos ARCO</h2>
            <p>
              Conforme a la{" "}
              <strong>
                Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
              </strong>{" "}
              y su Reglamento, tienes derecho a:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
              <li>
                <strong>Acceso</strong> — conocer qué datos personales tenemos sobre ti.
              </li>
              <li>
                <strong>Rectificación</strong> — solicitar la corrección de datos inexactos o incompletos.
              </li>
              <li>
                <strong>Cancelación</strong> — pedir la eliminación de tus datos cuando ya no sean
                necesarios para la finalidad que motivó su tratamiento.
              </li>
              <li>
                <strong>Oposición</strong> — oponerte al tratamiento de tus datos para determinadas
                finalidades.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, envía un correo a{" "}
              <a href="mailto:vongolax564@gmail.com" className="text-[#7C3AED] underline">
                vongolax564@gmail.com
              </a>{" "}
              con el asunto <em>"Derechos ARCO"</em> e indica el derecho que deseas ejercer. Responderemos
              en un plazo máximo de <strong>20 días hábiles</strong>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">8. Conservación de los datos</h2>
            <p>
              Conservamos tus datos personales durante el tiempo que sea necesario para cumplir las
              finalidades descritas en este aviso, o mientras exista una relación activa contigo o con el
              negocio que utiliza Agendly. Una vez concluida la relación, los datos se eliminarán o
              anonimizarán en un plazo máximo de <strong>12 meses</strong>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">9. Cambios a este aviso</h2>
            <p>
              DuoMind Solutions se reserva el derecho de actualizar esta Política de Privacidad en
              cualquier momento. Cualquier cambio sustancial será notificado a través del panel de
              administración de Agendly o por correo electrónico a los negocios registrados. La fecha de
              última actualización se indica al inicio de este documento.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-[#7C3AED] mb-3">10. Contacto</h2>
            <p>
              Para cualquier duda, comentario o solicitud relacionada con esta Política de Privacidad,
              contáctanos en:
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
          <Link href="/terms" className="text-[#7C3AED] hover:underline font-medium">
            Ver Términos de Servicio →
          </Link>
        </div>
      </main>
    </div>
  );
}
