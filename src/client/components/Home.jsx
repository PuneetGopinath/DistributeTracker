export default function Home() {
    const features = [
        "Intuitive interface for easy data entry",
        "Real-time collaboration for outreach teams",
        "Comprehensive reporting and analytics (coming soon)"        
    ];
    return (
        <>
            <h1>Welcome to DistributeTracker</h1>
            <p>Your personal distribution tracking solution.</p>
            <p>This is a simple and efficient web app designed to help ISKCON devotees and outreach teams seamlessly record and organize counts of distributed items during their services.</p>

            <h2>Features</h2>
            <div className="features cards-container">
                {features.map((feature, index) => (
                    <div key={index} className="card" style={{"animationDelay": `${index * 100}ms`}}>
                        <p>{feature}</p>
                    </div>
                ))}
            </div>
        </>
    );
};