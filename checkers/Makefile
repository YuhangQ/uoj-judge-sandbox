
INCLUDE_PATH = include
CXXFLAGS = -I../libs -O2

EXE_CHECKER = \
	bcmp \
	acmp \
	caseicmp \
	casencmp \
	casewcmp \
	dcmp \
	fcmp \
	hcmp \
	icmp \
	lcmp \
	ncmp \
	rcmp \
	rcmp4 \
	rcmp6 \
	rcmp9 \
	rncmp \
	uncmp \
	wcmp \
	yesno

checker: $(EXE_CHECKER)

% : %.cpp
	$(CXX) $(CXXFLAGS) $(EXTRA_CXXFLAGS) $< -o $@

$(EXE_CHECKER): ../libs/testlib.h

clean:
	rm -f $(EXE_CHECKER)