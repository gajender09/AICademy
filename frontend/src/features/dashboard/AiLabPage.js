import { useNavigate, useOutletContext } from "react-router-dom";

import {
  FaRobot,
  FaBrain,
  FaChartLine,
  FaGraduationCap,
  FaArrowRight,
  FaLock,
} from "react-icons/fa";

import "../../styles/AiLabPage.css";


const AiLabPage = () => {

  const navigate = useNavigate();

  const { user } = useOutletContext();


  const isProUser = user?.plan === "pro";


  /*
    ============================
    FUTURE AI LAB FEATURE
    ============================

    This component will be replaced
    when AI Lab is implemented.

  */

  const renderAILab = () => {

    return (

      <div className="ai-coming-soon-container">

        <FaRobot />

        <h1>
          AI Lab Coming Soon
        </h1>

        <p>
          Your AI learning assistant,
          personalized tutors and advanced
          learning tools will appear here.
        </p>


      </div>

    );

  };



  const features = [
    {
      icon:<FaBrain/>,
      text:"AI Personal Learning Assistant"
    },
    {
      icon:<FaGraduationCap/>,
      text:"AI Generated Practice Sessions"
    },
    {
      icon:<FaChartLine/>,
      text:"Advanced Learning Analytics"
    },
    {
      icon:<FaRobot/>,
      text:"Future AI Mentor Features"
    }
  ];



  const renderUpgradeScreen = () => {


    return (

      <div className="ai-upgrade-container">


        <div className="ai-upgrade-card">


          <div className="ai-upgrade-icon">

            <FaLock/>

          </div>



          <h1>
            Unlock AI Lab
          </h1>



          <p>

            Get access to powerful AI learning
            tools designed to personalize your
            learning journey.

          </p>



          <div className="ai-feature-list">

            {
              features.map((feature,index)=>(

                <div key={index}>

                  {feature.icon}

                  <span>
                    {feature.text}
                  </span>

                </div>

              ))
            }


          </div>



          <button
            onClick={() => navigate("/pricing")}
          >

            Upgrade to Pro

            <FaArrowRight/>

          </button>



        </div>


      </div>

    );

  };



  return (

    <>

      {
        isProUser
          ?
          renderAILab()
          :
          renderUpgradeScreen()
      }


    </>

  );

};


export default AiLabPage;