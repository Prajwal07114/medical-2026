import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://medical-2026.onrender.com";


export default function Contact() {

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: FormEvent) => {

    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim()
    ) {
      return;
    }


    setIsLoading(true);


    try {

      const response = await fetch(`${API_BASE}/contact`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          name: form.name.trim(),

          email: form.email.trim(),

          message: form.message.trim(),

        }),

      });



      if (response.ok) {

        setSubmitted(true);

      } else {

        const error = await response.json();

        console.error(
          "Contact API error:",
          error
        );

        setSubmitted(true);

      }


    } catch (error) {

      console.error(
        "Failed to send message:",
        error
      );

      setSubmitted(true);


    } finally {

      setIsLoading(false);

    }

  };



  return (

    <div className="min-h-screen flex flex-col">


      <main className="flex-1">

        <div className="mx-auto max-w-5xl px-4 py-16">


          <motion.div

            initial={{
              opacity: 0,
              y: 20
            }}

            animate={{
              opacity: 1,
              y: 0
            }}

            className="text-center"

          >

            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">

              Get in Touch

            </h1>


            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">

              Have questions about MediChat? We'd love to hear from you.
              Fill out the form below or reach out directly.

            </p>


          </motion.div>




          <div className="mt-12 grid gap-10 lg:grid-cols-5">


            <motion.div

              initial={{
                opacity: 0,
                x: -20
              }}

              animate={{
                opacity: 1,
                x: 0
              }}

              transition={{
                delay: 0.15
              }}

              className="space-y-6 lg:col-span-2"

            >


              <ContactItem

                icon={
                  <Mail className="h-5 w-5 text-primary" />
                }

                label="Email"

                value="manishmore2006@gmail.com"

              />



              <ContactItem

                icon={
                  <Phone className="h-5 w-5 text-medical-teal" />
                }

                label="Phone"

                value="+1 (800) 555-MEDI"

              />



              <ContactItem

                icon={
                  <MapPin className="h-5 w-5 text-primary" />
                }

                label="Address"

                value="123 Health Boulevard, Medical District, CA 90210"

              />


            </motion.div>





            <motion.div

              initial={{
                opacity: 0,
                x: 20
              }}

              animate={{
                opacity: 1,
                x: 0
              }}

              transition={{
                delay: 0.2
              }}

              className="lg:col-span-3"

            >


              {
                submitted ? (

                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center chat-shadow">


                    <CheckCircle className="h-12 w-12 text-medical-teal mb-4" />


                    <h3 className="text-xl font-semibold text-foreground">

                      Message Sent!

                    </h3>


                    <p className="mt-2 text-sm text-muted-foreground">

                      Thank you for reaching out.
                      We'll get back to you within 24 hours.

                    </p>



                    <button

                      onClick={() => {

                        setSubmitted(false);

                        setForm({
                          name: "",
                          email: "",
                          message: ""
                        });

                      }}

                      className="mt-6 rounded-xl medical-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"

                    >

                      Send Another Message

                    </button>


                  </div>


                ) : (


                  <form

                    onSubmit={handleSubmit}

                    className="rounded-2xl border border-border bg-card p-6 sm:p-8 chat-shadow space-y-5"

                  >


                    <input

                      type="text"

                      value={form.name}

                      onChange={(e) =>
                        setForm({
                          ...form,
                          name: e.target.value
                        })
                      }

                      placeholder="Your full name"

                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5"

                      required

                      disabled={isLoading}

                    />



                    <input

                      type="email"

                      value={form.email}

                      onChange={(e) =>
                        setForm({
                          ...form,
                          email: e.target.value
                        })
                      }

                      placeholder="you@example.com"

                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5"

                      required

                      disabled={isLoading}

                    />



                    <textarea

                      value={form.message}

                      onChange={(e) =>
                        setForm({
                          ...form,
                          message: e.target.value
                        })
                      }

                      placeholder="How can we help you?"

                      rows={5}

                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 resize-none"

                      required

                      disabled={isLoading}

                    />




                    <button

                      type="submit"

                      disabled={isLoading}

                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl medical-gradient px-5 py-3 font-semibold disabled:opacity-50"

                    >

                      {
                        isLoading ? (
                          <>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="h-4 w-4" />
                          </>
                        )
                      }


                    </button>


                  </form>


                )
              }


            </motion.div>


          </div>


        </div>


      </main>


      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">

        © {new Date().getFullYear()} MediChat. For informational purposes only.

      </footer>


    </div>

  );

}




function ContactItem({

  icon,

  label,

  value,

}: {

  icon: React.ReactNode;

  label: string;

  value: string;

}) {


  return (

    <div className="flex items-start gap-4">

      <div>
        {icon}
      </div>


      <div>

        <p className="font-medium">
          {label}
        </p>


        <p className="text-sm text-muted-foreground">
          {value}
        </p>


      </div>


    </div>

  );

}