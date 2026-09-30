import 'dotenv/config';
import { connectDatabase } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Institute } from '../modules/institutes/institute.model.js';
import { Survey, SurveyResponse } from '../modules/surveys/survey.model.js';

async function testSurveys() {
  console.log('=== Starting Surveys & Course Exit Engine Verification ===');
  await connectDatabase();

  try {
    const faculty = await User.findOne({ role: 'FACULTY', facultyRole: 'HOD' });
    const student = await User.findOne({ role: 'STUDENT', status: 'ACTIVE' });
    const institute = await Institute.findOne();

    if (!faculty || !student || !institute) {
      throw new Error('Test preconditions not met: faculty, student, or institute not found');
    }

    console.log(`Testing with Faculty: ${faculty.name} (${faculty.department})`);
    console.log(`Testing with Student: ${student.name} (${student.department})`);

    // Clean up test surveys
    await Survey.deleteMany({ title: { $regex: /^TEST_/ } });
    await SurveyResponse.deleteMany({ instituteId: institute._id });

    // 1. Create a Course Exit Survey with NBA CO1-CO5 questions
    const survey = await Survey.create({
      instituteId: institute._id,
      title: 'TEST_Course Exit Survey - Database Systems',
      description: 'End of semester NBA CO attainment evaluation',
      type: 'COURSE_EXIT',
      department: faculty.department,
      courseName: 'Database Management Systems',
      courseCode: 'CS501',
      academicYear: student.academicYear || 'Third Year',
      semester: 'Semester 5',
      author: {
        id: faculty._id,
        name: faculty.name,
        role: faculty.role,
        department: faculty.department,
        facultyRole: faculty.facultyRole,
      },
      questions: [
        {
          id: 'q_co1',
          text: 'CO1: Analyze relational data models and ER schemas',
          type: 'RATING_5',
          coTag: 'CO1',
          required: true,
        },
        {
          id: 'q_co2',
          text: 'CO2: Formulate complex SQL queries and normalization',
          type: 'RATING_5',
          coTag: 'CO2',
          required: true,
        },
        {
          id: 'q_feedback',
          text: 'Any suggestions to improve curriculum delivery?',
          type: 'TEXT',
          required: false,
        },
      ],
      status: 'ACTIVE',
      isAnonymous: true,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalResponses: 0,
    });

    console.log(`1. Course Exit Survey created with ID: ${survey._id}`);

    // 2. Student submits response
    const response = await SurveyResponse.create({
      surveyId: survey._id,
      studentId: student._id,
      instituteId: institute._id,
      answers: [
        { questionId: 'q_co1', ratingValue: 5 },
        { questionId: 'q_co2', ratingValue: 4 },
        { questionId: 'q_feedback', textValue: 'Great lab sessions on PostgreSQL!' },
      ],
      isAnonymous: true,
    });
    survey.totalResponses += 1;
    await survey.save();

    console.log(`2. Student response recorded with ID: ${response._id}`);

    // 3. Test duplicate submission prevention
    let duplicatePrevented = false;
    try {
      await SurveyResponse.create({
        surveyId: survey._id,
        studentId: student._id,
        instituteId: institute._id,
        answers: [{ questionId: 'q_co1', ratingValue: 3 }],
      });
    } catch (err: any) {
      if (err.code === 11000) {
        duplicatePrevented = true;
      }
    }

    if (!duplicatePrevented) {
      throw new Error('Duplicate response prevention failed!');
    }
    console.log('3. Duplicate response prevention enforced via unique compound index.');

    // 4. Verify CO attainment calculation
    const responses = await SurveyResponse.find({ surveyId: survey._id });
    const q1Ratings = responses
      .map((r) => r.answers.find((a) => a.questionId === 'q_co1')?.ratingValue)
      .filter((v): v is number => typeof v === 'number');

    const avgQ1 = q1Ratings.reduce((a, b) => a + b, 0) / q1Ratings.length;
    const co1Percentage = (avgQ1 / 5) * 100;
    console.log(`4. CO1 Attainment: ${avgQ1}/5 (${co1Percentage}%) - Attainment Level: ${co1Percentage >= 75 ? 'HIGH' : 'MODERATE'}`);

    console.log('=== All Surveys & Course Exit Engine Verifications PASSED! ===');
    process.exit(0);
  } catch (err) {
    console.error('Survey test failed:', err);
    process.exit(1);
  }
}

testSurveys();
