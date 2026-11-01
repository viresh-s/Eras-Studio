export default function AboutPage() {
  return (
    <div className="py-20 max-w-4xl mx-auto px-6 space-y-16">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-[#141413]">
          About Eras Studio
        </h1>
      </section>

      {/* Mission & Vision */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-8">
            <h3 className="text-2xl font-serif font-bold text-[#141413]">
              Our Mission
            </h3>
          </div>

          <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-8">
            <h3 className="text-2xl font-serif font-bold text-[#141413]">
              Our Vision
            </h3>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white border border-[#E8E8E3] rounded-3xl p-10">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-[#141413] text-center mb-8">
          Our Values
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 text-center border border-[#F0F0EB] rounded-2xl">
            <h4 className="font-serif font-bold text-xl text-[#141413]">
              Passion First
            </h4>
          </div>

          <div className="p-6 text-center border border-[#F0F0EB] rounded-2xl">
            <h4 className="font-serif font-bold text-xl text-[#141413]">
              Community
            </h4>
          </div>

          <div className="p-6 text-center border border-[#F0F0EB] rounded-2xl">
            <h4 className="font-serif font-bold text-xl text-[#141413]">
              Transparency
            </h4>
          </div>
        </div>
      </section>
    </div>
  );
}
