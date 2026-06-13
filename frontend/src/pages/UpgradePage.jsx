import "../styles/UpgradePage.css";
import { FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


const plans = [

  {
    name: "FREE",
    price: "₹0",
    duration: "",
    description: "Start learning with AI-powered tools",

    features: [
      "3 AI Courses",
      "Basic Learning Roadmaps",
      "Quiz Generation",
      "Progress Tracking",
    ],

    button: "Current Plan",

    current: true,
  },


  {
    name: "PRO",
    price: "₹499",
    duration: "/month",

    description: "For serious learners building skills",

    popular: true,

    features: [
      "Unlimited AI Courses",
      "AI Lab Access",
      "Advanced Analytics",
      "AI Tutor",
      "Unlimited Quizzes",
    ],

    button: "Upgrade",
  },


  {
    name: "PREMIUM",

    price: "₹999",

    duration: "/month",

    description:
      "For career-focused learners",

    features: [
      "Everything in Pro",
      "Personal AI Mentor",
      "Interview Preparation",
      "Project Reviews",
      "Career Roadmaps",
    ],

    button: "Upgrade",
  }

];



const UpgradePage = () => {


  const navigate = useNavigate();



  return (

    <div className="pricing-page">


      <div className="pricing-header">

        <h1>
          AICademy Pricing
        </h1>

        <p>
          Choose the plan that fits your learning journey
        </p>

      </div>



      <div className="pricing-container">


        {
          plans.map((plan, index) => (


            <div

              key={index}

              className={`pricing-card 
${plan.popular ? "popular" : ""}
`}

            >


              {
                plan.popular && (

                  <div className="popular-badge">
                    MOST POPULAR
                  </div>

                )
              }




              <h2>
                {plan.name}
              </h2>



              <div className="price">


                {plan.price}


                <span>
                  {plan.duration}
                </span>


              </div>



              <div className="plan-features">


                {
                  plan.features.map((feature, i) => (


                    <div key={i}>

                      <FaCheck />

                      <span>
                        {feature}
                      </span>

                    </div>


                  ))
                }


              </div>




              <button


                disabled={plan.current}


                className={
                  plan.current
                    ?
                    "current-plan-btn"
                    :
                    "pricing-btn"
                }


                onClick={() => {

                  if (!plan.current) {

                    navigate("/payment");

                  }

                }}


              >

                {plan.button}


              </button>



            </div>


          ))
        }


      </div>


    </div>


  );

};


export default UpgradePage;